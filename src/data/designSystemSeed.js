// The starter design system: a full Brand → Semantic → Component token set.
//
// Two things use it, and they must not drift apart:
//   • the demo project, which opens with these tokens already mapped onto components
//   • ProjectDetail's token migration, as the fallback for a project saved before
//     tokens were layered

import { ENTRANCE_TOKENS } from './motionKeyframes.js';

export const MOCK_TOKENS = {
  Color: [
    { name: 'brand.color.primary',    value: '#FC0694', type: 'color', layer: 'Brand', description: 'Primary brand identity color' },
    { name: 'brand.color.secondary',  value: '#1A1A24', type: 'color', layer: 'Brand', description: 'Secondary brand slate color' },
    { name: 'brand.color.accent',     value: '#3B82F6', type: 'color', layer: 'Brand', description: 'Vibrant high-contrast accent' },
    { name: 'brand.color.background', value: '#0D0D12', type: 'color', layer: 'Brand', description: 'Deep dark application canvas' },
    { name: 'brand.color.surface',    value: '#13131A', type: 'color', layer: 'Brand', description: 'Elevated panel and card background' },
    { name: 'brand.color.text',       value: '#FFFFFF', type: 'color', layer: 'Brand', description: 'High-contrast reading text' },
    { name: 'color.action',           value: '{brand.color.primary}',    type: 'color', layer: 'Semantic' },
    { name: 'color.bg.primary',       value: '{brand.color.background}', type: 'color', layer: 'Semantic' },
    { name: 'color.bg.surface',       value: '{brand.color.surface}',    type: 'color', layer: 'Semantic' },
    { name: 'color.text.primary',     value: '{brand.color.text}',       type: 'color', layer: 'Semantic' },
    { name: 'color.text.secondary',   value: '#8C8CA1',                  type: 'color', layer: 'Semantic' },
    { name: 'button.bg',   value: '{color.action}',        type: 'color', layer: 'Component' },
    { name: 'button.text', value: '{color.text.primary}',  type: 'color', layer: 'Component' },
    { name: 'input.bg',    value: '{color.bg.surface}',    type: 'color', layer: 'Component' },
    { name: 'input.text',  value: '{color.text.primary}',  type: 'color', layer: 'Component' },
  ],
  Typography: [
    { name: 'brand.font.heading', value: 'Outfit', type: 'fontFamily', layer: 'Brand' },
    { name: 'brand.font.body',    value: 'Inter',  type: 'fontFamily', layer: 'Brand' },
    { name: 'brand.font.size.xs',   value: '0.75rem',  type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.sm',   value: '0.875rem', type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.base', value: '1rem',     type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.lg',   value: '1.25rem',  type: 'fontSize', layer: 'Brand' },
    { name: 'brand.font.size.xl',   value: '1.5rem',   type: 'fontSize', layer: 'Brand' },
    { name: 'text.heading',  value: '{brand.font.heading}',    type: 'fontFamily', layer: 'Semantic' },
    { name: 'text.body',     value: '{brand.font.body}',       type: 'fontFamily', layer: 'Semantic' },
    { name: 'text.size.ui',  value: '{brand.font.size.sm}',    type: 'fontSize',   layer: 'Semantic' },
    { name: 'button.font-family', value: '{text.heading}', type: 'fontFamily', layer: 'Component' },
    { name: 'button.font-size',   value: '{text.size.ui}', type: 'fontSize',   layer: 'Component' },
  ],
  Spacing: [
    { name: 'brand.space.1', value: '4px',  type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.2', value: '8px',  type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.3', value: '12px', type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.4', value: '16px', type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.6', value: '24px', type: 'spacing', layer: 'Brand' },
    { name: 'brand.space.8', value: '32px', type: 'spacing', layer: 'Brand' },
    { name: 'space.tight',       value: '{brand.space.2}', type: 'spacing', layer: 'Semantic' },
    { name: 'space.comfortable', value: '{brand.space.4}', type: 'spacing', layer: 'Semantic' },
    { name: 'space.loose',       value: '{brand.space.8}', type: 'spacing', layer: 'Semantic' },
    { name: 'button.padding-x', value: '{space.comfortable}', type: 'spacing', layer: 'Component' },
    { name: 'button.padding-y', value: '{space.tight}',       type: 'spacing', layer: 'Component' },
    { name: 'input.padding',    value: '{space.comfortable}', type: 'spacing', layer: 'Component' },
  ],
  Sizing: [
    { name: 'brand.size.xs', value: '20px',  type: 'width', layer: 'Brand' },
    { name: 'brand.size.sm', value: '32px',  type: 'width', layer: 'Brand' },
    { name: 'brand.size.md', value: '48px',  type: 'width', layer: 'Brand' },
    { name: 'brand.size.lg', value: '64px',  type: 'width', layer: 'Brand' },
    { name: 'brand.size.xl', value: '96px',  type: 'width', layer: 'Brand' },
    { name: 'size.full',     value: '100%',  type: 'width', layer: 'Semantic' },
    { name: 'control.height.sm', value: '{brand.size.sm}', type: 'height', layer: 'Semantic' },
    { name: 'control.height.md', value: '40px',            type: 'height', layer: 'Semantic' },
    { name: 'control.height.lg', value: '{brand.size.md}', type: 'height', layer: 'Semantic' },
  ],
  Layout: [
    // Named stacking levels, so overlays are ordered by intent rather than by
    // whoever last typed a bigger number.
    { name: 'layer.base',     value: '0',    type: 'z-index', layer: 'Semantic' },
    { name: 'layer.dropdown', value: '100',  type: 'z-index', layer: 'Semantic' },
    { name: 'layer.overlay',  value: '400',  type: 'z-index', layer: 'Semantic' },
    { name: 'layer.modal',    value: '2000', type: 'z-index', layer: 'Semantic' },
  ],
  Flexbox: [
    { name: 'gap.tight',       value: '{brand.space.2}', type: 'gap', layer: 'Semantic' },
    { name: 'gap.comfortable', value: '{brand.space.4}', type: 'gap', layer: 'Semantic' },
    { name: 'gap.loose',       value: '{brand.space.8}', type: 'gap', layer: 'Semantic' },
  ],
  Lists: [
    { name: 'list.marker.none',    value: 'none',    type: 'list-style-type', layer: 'Semantic' },
    { name: 'list.marker.disc',    value: 'disc',    type: 'list-style-type', layer: 'Semantic' },
    { name: 'list.marker.decimal', value: 'decimal', type: 'list-style-type', layer: 'Semantic' },
  ],
  Border: [
    { name: 'brand.radius.none', value: '0px',    type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.sm',   value: '4px',    type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.md',   value: '8px',    type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.lg',   value: '16px',   type: 'borderRadius', layer: 'Brand' },
    { name: 'brand.radius.full', value: '9999px', type: 'borderRadius', layer: 'Brand' },
    { name: 'radius.interactive', value: '{brand.radius.md}',   type: 'borderRadius', layer: 'Semantic' },
    { name: 'radius.container',   value: '{brand.radius.lg}',   type: 'borderRadius', layer: 'Semantic' },
    { name: 'button.radius', value: '{radius.interactive}', type: 'borderRadius', layer: 'Component' },
    { name: 'input.radius',  value: '{radius.interactive}', type: 'borderRadius', layer: 'Component' },
    { name: 'card.radius',   value: '{radius.container}',   type: 'borderRadius', layer: 'Component' },
  ],
  Shadow: [
    { name: 'brand.shadow.sm', value: '0 1px 2px rgba(0,0,0,0.3)',   type: 'shadow', layer: 'Brand' },
    { name: 'brand.shadow.md', value: '0 4px 16px rgba(0,0,0,0.4)',  type: 'shadow', layer: 'Brand' },
    { name: 'brand.shadow.lg', value: '0 16px 48px rgba(0,0,0,0.5)', type: 'shadow', layer: 'Brand' },
    { name: 'shadow.subtle',  value: '{brand.shadow.sm}', type: 'shadow', layer: 'Semantic' },
    { name: 'shadow.overlay', value: '{brand.shadow.lg}', type: 'shadow', layer: 'Semantic' },
    { name: 'card.shadow',   value: '{shadow.subtle}',  type: 'shadow', layer: 'Component' },
    { name: 'modal.shadow',  value: '{shadow.overlay}', type: 'shadow', layer: 'Component' },
  ],
  Motion: [
    { name: 'brand.duration.fast',   value: '150ms', type: 'duration', layer: 'Brand' },
    { name: 'brand.duration.base',   value: '250ms', type: 'duration', layer: 'Brand' },
    { name: 'brand.duration.slow',   value: '500ms', type: 'duration', layer: 'Brand' },
    { name: 'brand.easing.default',  value: 'cubic-bezier(0.4,0,0.2,1)', type: 'easing', layer: 'Brand' },
    { name: 'duration.transition', value: '{brand.duration.base}',   type: 'duration', layer: 'Semantic' },
    { name: 'easing.standard',     value: '{brand.easing.default}',  type: 'easing',   layer: 'Semantic' },
    { name: 'button.transition-duration', value: '{duration.transition}', type: 'duration', layer: 'Component' },
    { name: 'button.easing',             value: '{easing.standard}',      type: 'easing',   layer: 'Component' },
    { name: 'motion.easing.entrance', value: 'cubic-bezier(0, 0, 0.2, 1)', type: 'easing', layer: 'Semantic', description: 'Decelerating — for things arriving' },
    { name: 'motion.easing.exit',     value: 'cubic-bezier(0.4, 0, 1, 1)', type: 'easing', layer: 'Semantic', description: 'Accelerating — for things leaving' },
    // The entrance animations. Their value is a keyframes name, and those keyframes
    // travel with every CSS export — see motionKeyframes.js.
    ...ENTRANCE_TOKENS,
  ],
};
