<?php

declare(strict_types=1);

namespace App\Support\Curriculum;

use ParticleAcademy\LaravelCourses\Models\Course;
use ParticleAcademy\LaravelCourses\Models\Curriculum;

/**
 * Which courses a learner can actually open, asked of the DATABASE.
 *
 * A link to a course is only honest while `/learn/{slug}` would answer it, and
 * that is decided by the rows, not by the content class: the curriculum may not
 * have been built yet on a fresh install, a course may be archived, or an
 * operator may have unpublished one. So a Feature page's "Learn" link is
 * rendered from this, never from the slug FeatureSites names.
 */
final class ListedCourses
{
    /**
     * The course as a link, or null when it is not published in the curriculum.
     *
     * @return array{slug: string, title: string, href: string}|null
     */
    public static function find(string $slug): ?array
    {
        $curriculum = Curriculum::query()
            ->where('slug', FancyCurriculumContent::CURRICULUM_SLUG)
            ->where('is_published', true)
            ->first();

        if ($curriculum === null) {
            return null;
        }

        /** @var Course|null $course */
        $course = $curriculum->courses()
            ->where('courses.slug', $slug)
            ->where('courses.is_published', true)
            ->first();

        if ($course === null) {
            return null;
        }

        return [
            'slug' => (string) $course->slug,
            'title' => (string) $course->title,
            'href' => "/learn/{$course->slug}",
        ];
    }
}
