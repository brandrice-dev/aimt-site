/* Education publication integrity: one previously owner-approved teaching
   illustration has a public education copy. Preserve the exact approved
   article HTML URL without reopening any other premium media path. */
import { servePaidMedia } from '../../../_lib/paid-content/media.mjs';

const PUBLIC_APPROVED_EDUCATION_ALIAS =
  '/assets/images/course/module-06/module-06-dry-scalp-vs-dandruff-illustration.webp';
const PUBLIC_APPROVED_EDUCATION_IMAGE =
  '/assets/images/education/dry-scalp-vs-dandruff-illustration.webp';

async function serveCourseImage(context) {
  const path = new URL(context.request.url).pathname;
  if (path === PUBLIC_APPROVED_EDUCATION_ALIAS) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: PUBLIC_APPROVED_EDUCATION_IMAGE,
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
  return servePaidMedia(context);
}
export const onRequestGet = serveCourseImage;
export const onRequestHead = serveCourseImage;
