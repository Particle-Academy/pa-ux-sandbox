import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, type ReactNode } from 'react';

vi.mock('../../resources/js/Pages/Layout', () => ({
    Layout: ({ children }: { children: ReactNode }) => createElement('div', null,
        createElement('header', { 'data-showcase-layout': '' }), children,
        createElement('footer', { 'data-showcase-layout': '' })),
}));
vi.mock('@inertiajs/react', () => ({ Head: () => null, Link: 'a' }));
vi.mock('@particle-academy/fancy-inertia/seo', () => ({ Seo: () => null }));
vi.mock('../../resources/js/Pages/Inspiration/styles', () => ({
    STYLE_COMPONENTS: { fieldwork: { swiss: () => createElement('main', { 'data-style-content': '' }, 'Actual style') } },
}));

import InspirationShow from '../../resources/js/Pages/Inspiration/Show';

const props = {
    collection: { id: 'fieldwork', name: 'FIELDWORK', count: 20, subject: 'a fictional studio', framing: 'Demo' },
    style: { id: 'swiss', name: 'Swiss', num: '01' },
    styles: [],
} as unknown as Parameters<typeof InspirationShow>[0];

describe('gallery preview chrome', () => {
    it('renders only the style when frameless', () => {
        const html = renderToStaticMarkup(createElement(InspirationShow, { ...props, framed: false }));
        expect(html).toContain('data-style-content');
        expect(html).not.toContain('data-gallery-frame');
        expect(html).not.toContain('data-showcase-layout');
    });

    it('preserves the gallery frame and showcase layout by default', () => {
        const html = renderToStaticMarkup(createElement(InspirationShow, props));
        expect(html).toContain('data-style-content');
        expect(html).toContain('data-gallery-frame');
        expect(html.match(/data-showcase-layout/g)).toHaveLength(2);
    });

    it('preserves the unknown component placeholder in either mode', () => {
        for (const framed of [false, true]) {
            const html = renderToStaticMarkup(createElement(InspirationShow, {
                ...props, framed, style: { ...props.style, id: 'unbuilt' },
            }));
            expect(html).not.toContain('data-style-content');
            expect(html.length).toBeGreaterThan(100);
            expect(html.includes('data-gallery-frame')).toBe(framed);
        }
    });
});
