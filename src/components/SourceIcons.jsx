// Icons for the Brand Context Engine source cards.
//
// All of them draw with `currentColor` so they inherit each source's `tint` from SOURCE_META
// and follow the theme, rather than being hardcoded black on a dark panel.

// Supplied Figma mark. Its 733x1052 viewBox is kept as-is, along with strokeWidth 15.081,
// which scales with the viewBox — so the stroke stays correct at any rendered size. Rendered
// 14x20 to preserve the 0.697 aspect ratio.
export const FigmaIcon = () => (
  <svg width="14" height="20" viewBox="0 0 733 1052" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M698.342 198.006C698.342 288.548 624.943 361.946 534.402 361.946H366.204V34.0664H534.402C624.943 34.0664 698.342 107.465 698.342 198.006Z" stroke="currentColor" strokeWidth="15.081" />
    <path d="M34.0654 198.006C34.0654 288.548 107.464 361.946 198.005 361.946H366.203V34.0664H198.005C107.464 34.0664 34.0654 107.465 34.0654 198.006Z" stroke="currentColor" strokeWidth="15.081" />
    <path d="M34.0654 525.889C34.0654 616.43 107.464 689.829 198.005 689.829H366.203V361.949H198.005C107.464 361.949 34.0654 435.347 34.0654 525.889Z" stroke="currentColor" strokeWidth="15.081" />
    <path d="M34.0654 853.764C34.0654 944.306 108.521 1017.7 199.063 1017.7C290.78 1017.7 366.203 943.352 366.203 851.635V689.824H198.005C107.464 689.824 34.0654 763.222 34.0654 853.764Z" stroke="currentColor" strokeWidth="15.081" />
    <path d="M366.204 525.889C366.204 616.43 439.602 689.829 530.144 689.829H534.402C624.943 689.829 698.342 616.43 698.342 525.889C698.342 435.347 624.943 361.949 534.402 361.949H530.144C439.602 361.949 366.204 435.347 366.204 525.889Z" stroke="currentColor" strokeWidth="15.081" />
  </svg>
);

// Supplied globe mark, filled rather than stroked.
export const WebsiteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M9 0C6.61305 0 4.32387 0.948212 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18C11.3869 18 13.6761 17.0518 15.364 15.364C17.0518 13.6761 18 11.3869 18 9C18 6.61305 17.0518 4.32387 15.364 2.63604C13.6761 0.948212 11.3869 0 9 0ZM1.11 9.68H3.62C3.66 10.59 3.787 11.494 4 12.38H1.84C1.43802 11.5306 1.19081 10.6163 1.11 9.68ZM9.68 4.28V1.19C10.6437 1.55622 11.4356 2.26962 11.9 3.19C12.1053 3.53733 12.2853 3.89733 12.44 4.27L9.68 4.28ZM12.9 5.63C13.132 6.513 13.27 7.418 13.31 8.33H9.68V5.63H12.9ZM8.32 1.19V4.28H5.56C5.71417 3.90765 5.89463 3.54674 6.1 3.2C6.56247 2.27585 7.35459 1.55866 8.32 1.19ZM8.32 5.63V8.33H4.7C4.74 7.418 4.878 6.513 5.11 5.63H8.32ZM3.62 8.32H1.11C1.19081 7.38374 1.43802 6.46942 1.84 5.62H4C3.78579 6.50549 3.65852 7.40978 3.62 8.32ZM4.7 9.68H8.32V12.38H5.11C4.87892 11.4969 4.74149 10.5919 4.7 9.68ZM8.33 13.68V16.77C7.36632 16.4038 6.57445 15.6904 6.11 14.77C5.90463 14.4233 5.72417 14.0623 5.57 13.69L8.33 13.68ZM9.68 16.77V13.73H12.44C12.2858 14.1023 12.1054 14.4633 11.9 14.81C11.4356 15.7304 10.6437 16.4438 9.68 16.81V16.77ZM9.68 12.33V9.63H13.3C13.2585 10.5419 13.1211 11.4469 12.89 12.33H9.68ZM14.39 9.63H16.9C16.8192 10.5663 16.572 11.4806 16.17 12.33H14C14.21 11.46 14.337 10.573 14.38 9.68L14.39 9.63ZM14.39 8.28C14.345 7.38623 14.2144 6.49884 14 5.63H16.16C16.563 6.48 16.81 7.394 16.89 8.33L14.39 8.28ZM15.39 4.28H13.6C13.2764 3.37015 12.807 2.51903 12.21 1.76C13.4544 2.31858 14.5353 3.18605 15.35 4.28H15.39ZM5.79 1.76C5.19302 2.51903 4.72355 3.37015 4.4 4.28H2.65C3.46472 3.18605 4.54562 2.31858 5.79 1.76ZM2.64 13.76H4.4C4.72355 14.6698 5.19302 15.521 5.79 16.28C4.54218 15.713 3.46095 14.8349 2.65 13.73L2.64 13.76ZM12.2 16.28C12.797 15.521 13.2664 14.6698 13.59 13.76H15.35C14.5303 14.8393 13.4498 15.6927 12.21 16.24L12.2 16.28Z" fill="currentColor" />
  </svg>
);

const stroke = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const DescriptionIcon = () => (
  <svg {...stroke} aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="15" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

export const ImagesIcon = () => (
  <svg {...stroke} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.6" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const StyleDictionaryIcon = () => (
  <svg {...stroke} aria-hidden="true">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const SOURCE_ICONS = {
  figma: FigmaIcon,
  website: WebsiteIcon,
  description: DescriptionIcon,
  images: ImagesIcon,
  styleDictionary: StyleDictionaryIcon,
};
