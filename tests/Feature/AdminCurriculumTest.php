<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ParticleAcademy\LaravelCourses\Models\Certificate;
use ParticleAcademy\LaravelCourses\Models\Curriculum;
use ParticleAcademy\LaravelCourses\Models\Enrollment;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

/**
 * The Learning admin.
 *
 * The curriculum shipped with a learner surface and no operator one, so "is
 * anyone finishing this?" could only be answered from a database client.
 *
 * Two things are worth guarding beyond "the page loads": that it is behind the
 * admin gate like every other admin route, and that it survives a database with
 * nothing in it — the state every fresh install starts in, and the one where a
 * divide-by-zero rate would render `NaN` at an operator.
 */
/** Pest test files share one function namespace, and AdminShopTest already owns `admin()`. */
function curriculumAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('is behind the admin gate', function () {
    $this->get('/admin/curriculum')->assertRedirect();

    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get('/admin/curriculum')
        ->assertForbidden();
});

it('renders for an admin', function () {
    $this->actingAs(curriculumAdmin())
        ->get('/admin/curriculum')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Curriculum'));
});

it('says the curriculum has not been built rather than showing an empty dashboard', function () {
    // A migration authors the curriculum, so this app always has one — the
    // branch is for a host that installed the package without it. Emptying the
    // table is the only honest way to reach it, and it is worth reaching:
    // distinguishing "not authored yet" from "authored, nobody enrolled" is the
    // difference between running the build command and hunting for missing
    // learners.
    Curriculum::query()->delete();

    $this->actingAs(curriculumAdmin())
        ->get('/admin/curriculum')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('curriculum', null)->where('stats', null));
});

it('reports zero rates instead of NaN when nobody has enrolled', function () {
    // The curriculum comes from a migration; no need to author one here.
    $this->actingAs(curriculumAdmin())
        ->get('/admin/curriculum')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.enrolled', 0)
            // The guarded division. Without it this is 0/0 and the operator
            // reads "NaN% of enrolments".
            ->where('stats.completion_rate', 0)
            ->where('stats.pass_rate', 0)
            ->etc()
        );
});

it('counts enrolments through the polymorphic relation', function () {
    // Enrollments are `enrollable_type` / `enrollable_id`, not a `curriculum_id`
    // column. A query written against the column that does not exist would
    // report zero forever and look merely unpopular.
    $curriculum = Curriculum::query()->firstOrFail();
    $learner = User::factory()->create(['name' => 'Ada Lovelace']);

    Enrollment::query()->create([
        'user_id' => $learner->id,
        'enrollable_type' => $curriculum->getMorphClass(),
        'enrollable_id' => $curriculum->getKey(),
        'status' => 'active',
        'started_at' => now(),
    ]);

    $this->actingAs(curriculumAdmin())
        ->get('/admin/curriculum')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.enrolled', 1)
            ->where('learners.0.learner', 'Ada Lovelace')
            ->etc()
        );
});

it('shows a learner NAME for a certificate, not an enrollment id', function () {
    // Certificates key on the enrollment, not the user, so showing a name needs
    // a hop. Skipping it is how an operator ends up reading a table of numbers.
    $curriculum = Curriculum::query()->firstOrFail();
    $learner = User::factory()->create(['name' => 'Grace Hopper']);

    $enrollment = Enrollment::query()->create([
        'user_id' => $learner->id,
        'enrollable_type' => $curriculum->getMorphClass(),
        'enrollable_id' => $curriculum->getKey(),
        'status' => 'active',
        'started_at' => now(),
    ]);

    Certificate::query()->create([
        'enrollment_id' => $enrollment->id,
        'verification_code' => 'FANCY-TEST-0001',
        'issued_at' => now(),
    ]);

    $this->actingAs(curriculumAdmin())
        ->get('/admin/curriculum')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('certificates.0.learner', 'Grace Hopper')
            ->where('certificates.0.code', 'FANCY-TEST-0001')
            ->etc()
        );
});
