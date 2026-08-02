/**
 * Session-authenticated POST helper for the learner actions.
 *
 * classroom's `CoursesClient` targets the package's `api/courses/*` routes,
 * which sit on Laravel's `api` middleware group — no session, so a browser
 * cookie cannot authenticate against them, and `laravel-courses` correctly
 * refuses to take a learner id from the request body. An Inertia host talks to
 * its own `web` routes instead; the CSRF token comes from the meta tag Laravel
 * already renders.
 */
export async function post<T = unknown>(url: string, body?: unknown): Promise<T> {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";

    const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN": token,
            "X-Requested-With": "XMLHttpRequest",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
        // Surface the status — a silent rejection here reads to the learner as
        // "the button does nothing", which is the worst failure mode for a
        // progress action they are relying on being recorded.
        throw new Error(`${response.status} ${response.statusText} — ${url}`);
    }

    return (await response.json()) as T;
}
