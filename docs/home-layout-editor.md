# Homepage layout and block photos

The official-site CMS now includes `/admin/layout.html`, linked from the existing admin navigation and homepage manager. It uses the existing CMS account and `site-media` bucket.

## Editing

- Hero photo remains at the top of the page.
- Service entrances, news and About Hana can move up/down or be hidden.
- Each section accepts its own photo, alt text, crop position and cover/contain mode.
- Sections support the existing layout, left photo, right photo or top photo.
- Custom photo/text sections can be added, reordered and removed, including an optional link.
- Desktop and 390px mobile previews use the actual homepage in a same-origin iframe.
- Drafts are saved only in the current browser, scoped to the Supabase project and signed-in user. Uploading a photo does not publish the homepage. Uploaded assets use the existing public media bucket.
- Publishing updates the singleton settings row. The `updated_at` condition rejects stale or unauthorized updates instead of showing a false success message.

The same editor now includes a page selector for the homepage plus 27 canonical public pages: course overview and individual courses, practice room, incubation, business and product services, PIF, fragrance works, journal and topics, news, subscription, shop, contact and inquiry forms, and legal information.

Each additional page has its own `site_page_layouts` row and version, along with a separate browser draft key. Editors can reorder/hide sections, change section headings, add optional block photos, replace existing static photos individually, and add custom image/text blocks. Header sections remain fixed. Dynamic article feeds retain their normal CMS article editor and keep refreshing within the selected page layout. Redirect aliases use their canonical destination. Reservation, member tools and externally hosted sites keep their existing management systems.

The preview keeps original form nodes and listeners but blocks link navigation and form submission. Public-page forms keep working normally.

## Release

Apply `supabase/migrations/20261107180142_home_layout_editor.sql` to `hanascent-cms` before deploying this code. The migration only adds nullable `home_layout` JSON and `hero_image_alt`; it leaves existing published settings and RLS policies unchanged. Existing `can_edit_cms()` and media-upload policies continue to enforce editor authorization.

A null `home_layout` keeps the current homepage layout. Once published, the JSON stores the section order, visibility, display options, photos and custom text. The legacy quick hero editor also updates the published hero block using a fresh read and version condition.

For additional pages, apply `supabase/migrations/20261107182700_all_page_layouts.sql` before deploying. It creates 27 rows with null layouts, enables RLS, grants public read access to published layouts and limits `UPDATE(layout)` to existing CMS editors. Editor accounts cannot insert rows, rename page keys or delete rows. The per-page timestamp trigger rejects stale edits independently of the homepage.

Rollback: retain the database columns and revert the code commit. No data deletion is needed.

## Verification

- `npm test` includes normalization, upload constraints and additive migration checks, alongside existing student and shop tests.
- Browser validation uses the actual HTML, CSS and Supabase client, with an isolated mock HTTP API and browser test session. It covers local draft persistence, no writes before publication, per-section upload, denied uploads, version conflicts, custom text escaping, photo `srcset` replacement, observer-preserving section moves and responsive layouts.
- No published layouts or production photos were changed while developing or testing this feature.
