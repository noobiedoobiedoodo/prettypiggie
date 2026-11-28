/**
 * Re-exports LocalProcessingGuard alongside concise UI copy constants so
 * client UI components have a single clean import surface.
 */
export {
  LocalProcessingGuard,
  PIGGIE_PRIVACY_SUMMARY,
} from './LocalProcessingGuard';

export const PIGGIE_PRIVACY_DISCLOSURE_SHORT =
  'Your camera stream, selfie, and facial landmarks stay 100% inside your browser and are never uploaded. Anonymous usage events (button steps, chosen makeup style, and device tier — never photos or landmarks) are sent to PrettyPiggie.com unless Do Not Track / GPC is active.';
