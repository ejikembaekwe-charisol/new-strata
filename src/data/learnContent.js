// The Learn guide: twelve chapters explaining design systems and where Strata sits.
//
// Kept out of the page component because it is prose, not markup — the page owns how a
// block is drawn, this file owns what the block says. Adding a chapter means adding an
// entry here; the table of contents and the scroll-spy read from the same array, so they
// cannot drift out of step with the page.
//
// Block kinds, all rendered by renderBlock in Learn.jsx:
//   p        a paragraph
//   h3 / h4  a section heading inside a chapter
//   ul       a bulleted list
//   token    a token name, shown as it would be written
//   flow     a chain of steps, each feeding the next
//   pipeline a horizontal sequence of stage names
//   cards    a grid of short titled blocks
//   stages   a numbered walkthrough
//   quote    a single line worth stopping on
//   qa       question-and-answer pairs

export const LEARN_CHAPTERS = [
  {
    id: 'the-problem',
    num: '01',
    title: 'The Problem',
    summary: 'Why design decisions scatter, and why keeping them aligned is the hard part.',
    lede: 'As a product grows, so does the number of decisions behind it.',
    blocks: [
      { t: 'p', v: 'Colors, typography, spacing, components, patterns, and other visual rules are created and reused across the product. Over time, these decisions can become difficult to keep consistent, especially as more people contribute to the product.' },

      { t: 'h3', v: 'Design decisions are often scattered' },
      { t: 'p', v: "A product's design language can exist across multiple places:" },
      { t: 'ul', v: ['Figma files', 'Design documentation', 'Codebases', 'Live websites', 'Design assets', "Individual team members' knowledge"] },
      { t: 'p', v: "When these sources aren't aligned, it becomes difficult to know which version represents the current product." },
      { t: 'p', v: 'A designer might recreate an existing component. A developer might implement a slightly different version. A change made in one place might never make it to another.' },
      { t: 'p', v: "These aren't necessarily individual mistakes. They are often symptoms of a system that is difficult to see and maintain." },

      { t: 'h3', v: 'Creating a system takes work' },
      { t: 'p', v: "For teams that don't have a formal design system, establishing one can be a significant undertaking." },
      { t: 'p', v: 'Someone has to identify the visual decisions already being made, determine which ones should be reusable, define components and their relationships, document how they should be used, and keep everything organized as the product evolves.' },
      { t: 'p', v: 'For a new product, there may not even be an existing system to document. The team has to establish the visual foundations while simultaneously building the product.' },

      { t: 'h3', v: 'Maintaining the system is another challenge' },
      { t: 'p', v: 'Creating a design system is only the beginning.' },
      { t: 'p', v: 'Products change. New features introduce new patterns. Components evolve. Brand decisions change. Designers and developers make updates independently.' },
      { t: 'p', v: 'Without a way to keep the system aligned with the product, the design system itself can become outdated.' },
      { t: 'p', v: 'Eventually, teams may have a design system that describes how their product used to work rather than how it works today.' },

      { t: 'h3', v: 'The underlying problem' },
      { t: 'p', v: "The challenge isn't simply creating a collection of reusable components." },
      { t: 'quote', v: "It's capturing the design language of a product, turning it into something structured and usable, and keeping it aligned as the product changes." },
      { t: 'p', v: "That's the problem Strata exists to help solve." },
    ],
  },

  {
    id: 'what-is-a-design-system',
    num: '02',
    title: 'What is a Design System?',
    summary: 'Tokens, components, assets, and the rules that connect them.',
    lede: 'A design system is a collection of reusable design decisions, components, and guidelines that help a team build a product consistently.',
    blocks: [
      { t: 'p', v: 'It gives designers and developers a shared language for how a product should look, feel, and behave.' },
      { t: 'p', v: 'A design system is more than a component library. It includes the foundational decisions behind those components, the components themselves, and the rules for using them.' },

      { t: 'h3', v: 'The building blocks of a design system' },

      { t: 'h4', v: 'Design Tokens' },
      { t: 'p', v: 'Tokens are the foundational values of a design system.' },
      { t: 'p', v: 'They define reusable properties such as:' },
      { t: 'ul', v: ['Colors', 'Typography', 'Spacing', 'Border radius', 'Shadows', 'Sizing', 'Breakpoints'] },
      { t: 'p', v: 'Instead of repeatedly defining the same values, teams give them meaningful names and reuse them across the product.' },
      { t: 'p', v: 'For example, instead of using a specific hex value everywhere, a system might define:' },
      { t: 'token', v: 'color.primary' },
      { t: 'p', v: 'The token can then be used wherever the product needs its primary color.' },

      { t: 'h4', v: 'Components' },
      { t: 'p', v: "Components are reusable interface elements built from the system's foundational decisions." },
      { t: 'p', v: 'Examples include:' },
      { t: 'ul', v: ['Buttons', 'Inputs', 'Cards', 'Modals', 'Navigation', 'Forms', 'Alerts'] },
      { t: 'p', v: 'Components can also have different states, variants, and properties.' },
      { t: 'p', v: 'For example, a button might have primary, secondary, and destructive variants, with states such as hover, disabled, and loading.' },

      { t: 'h4', v: 'Assets' },
      { t: 'p', v: 'Assets are the visual resources used across a product or brand.' },
      { t: 'p', v: 'These can include:' },
      { t: 'ul', v: ['Logos', 'Icons', 'Images', 'Illustrations', 'Brand graphics'] },
      { t: 'p', v: 'Keeping these resources organized and accessible makes it easier for teams to use the correct versions consistently.' },

      { t: 'h4', v: 'Patterns and Guidelines' },
      { t: 'p', v: 'Patterns and guidelines describe how the building blocks of the system should be used.' },
      { t: 'p', v: 'They can define things like:' },
      { t: 'ul', v: ['When to use a particular component', 'Which variant to choose', 'How components work together', 'How common interface patterns should behave', 'Rules around spacing, typography, or accessibility'] },
      { t: 'p', v: 'This is what helps a team move beyond simply having reusable components to having a consistent way of designing and building.' },

      { t: 'h3', v: 'How the pieces work together' },
      { t: 'p', v: 'The different parts of a design system are connected.' },
      { t: 'flow', v: [
        { label: 'Tokens', text: 'define the foundational values.' },
        { label: 'Components', text: 'use those values to create reusable interface elements.' },
        { label: 'Patterns and guidelines', text: 'explain how those components should be used together.' },
        { label: 'The product', text: 'uses the system to create consistent experiences.' },
      ] },
      { t: 'p', v: "A design system therefore isn't just a folder of components. It is a structured set of decisions and rules that work together." },

      { t: 'h3', v: 'A design system evolves' },
      { t: 'p', v: "A design system isn't something a team creates once and leaves untouched." },
      { t: 'p', v: 'As a product changes, the system may need to change with it. New components may be introduced, existing components may evolve, tokens may be updated, and guidelines may change.' },
      { t: 'p', v: "The goal isn't to create a system and freeze it." },
      { t: 'quote', v: 'The goal is to create a system that can grow alongside the product.' },
    ],
  },

  {
    id: 'what-is-strata',
    num: '03',
    title: 'What is Strata?',
    summary: 'Where Strata fits, the four activities it is built around, and what it will not do for you.',
    lede: 'Strata is a platform for creating and managing design systems.',
    blocks: [
      { t: 'p', v: 'It helps teams turn the design language of a product into a structured system that can be understood, reused, and connected to development.' },

      { t: 'h3', v: 'Where Strata fits' },
      { t: 'p', v: "A product's design system can exist in many forms and at different stages." },
      { t: 'p', v: 'You might have a complete design system, a collection of Figma files, a live product, brand assets, or simply an idea of how you want the product to look and feel.' },
      { t: 'p', v: 'Strata provides a place to bring that information together and turn it into a system.' },
      { t: 'p', v: "It can work with what already exists, or help establish a starting point when there isn't an existing system." },

      { t: 'h3', v: 'What Strata helps you do' },
      { t: 'p', v: 'Strata is built around four core activities:' },
      { t: 'cards', v: [
        { title: 'Create', text: 'Establish the foundations of a design system from existing design information or new input.' },
        { title: 'Organize', text: 'Bring tokens, components, assets, and other system elements into a structured environment.' },
        { title: 'Refine', text: 'Review the system and adjust its decisions as your product or design direction develops.' },
        { title: 'Connect', text: 'Make the system useful beyond design by connecting it to the development workflow.' },
      ] },
      { t: 'p', v: 'These activities form a continuous process rather than a one-time setup.' },

      { t: 'h3', v: 'Strata adapts to your starting point' },
      { t: 'p', v: "There isn't one correct way to begin building a design system." },
      { t: 'p', v: 'A team with an established product may want to capture what already exists. A team with a strong Figma foundation may want to structure its existing design work. A new product may need to establish its visual foundations from the beginning.' },
      { t: 'p', v: 'Strata is designed to support these different situations.' },
      { t: 'p', v: 'The important thing is not where you start, but what you are trying to build from that starting point.' },

      { t: 'h3', v: 'What Strata is not' },
      { t: 'p', v: "Strata does not decide what your product's design should be for you." },
      { t: 'p', v: 'It provides the structure and capabilities for creating and managing the system, while the design decisions remain yours.' },
      { t: 'p', v: "Your product's brand, visual direction, components, and rules should reflect the needs of your team and users." },
      { t: 'p', v: 'Strata gives those decisions a system to live in.' },

      { t: 'h3', v: 'The role of Strata' },
      { t: 'p', v: 'At its core, Strata is about making a design system usable beyond a collection of design files.' },
      { t: 'p', v: 'It provides a structured way to establish, organize, evolve, and connect the decisions that define how a product is designed and built.' },
      { t: 'p', v: 'The next section looks at the different places you can start from and what each starting point means for your system.' },
    ],
  },

  {
    id: 'where-are-you-starting-from',
    num: '04',
    title: 'Where Are You Starting From?',
    summary: 'Figma, a website, an existing system, or nothing at all.',
    lede: 'Not every team starts building a design system from the same place.',
    blocks: [
      { t: 'p', v: 'You may already have a product with established design decisions. You may have designs in Figma but no formal system. You may have a live website that represents the current product. Or you may be starting with an idea and no existing design system at all.' },
      { t: 'p', v: 'Strata supports these different starting points.' },

      { t: 'h3', v: 'Starting from Figma' },
      { t: 'p', v: 'Your Figma files may already contain many of the decisions that make up your design language.' },
      { t: 'p', v: 'Colors, typography, spacing, components, styles, and other reusable elements can provide a strong foundation for a design system.' },
      { t: 'p', v: 'This is useful when your product has been designed already, but the underlying system has not been formally structured.' },

      { t: 'h3', v: 'Starting from a Website' },
      { t: 'p', v: 'A live website can also be a source of design information.' },
      { t: 'p', v: 'The website reflects how the product currently looks and can provide insight into its visual language, including things like colors, typography, spacing, and interface patterns.' },
      { t: 'p', v: 'This can be particularly useful when the live product is more up to date than its design files.' },

      { t: 'h3', v: 'Starting from an Existing Design System' },
      { t: 'p', v: 'You may already have a design system, but need a better way to organize, manage, or connect it to the rest of your workflow.' },
      { t: 'p', v: 'An existing system can provide the foundation rather than requiring you to start from scratch.' },
      { t: 'p', v: 'The goal is to bring what you already have into a more structured environment.' },

      { t: 'h3', v: 'Starting with Nothing' },
      { t: 'p', v: "A design system doesn't have to begin with an existing product." },
      { t: 'p', v: 'For a new product, you may only have a product idea, brand direction, target audience, or preferences for how the experience should feel.' },
      { t: 'p', v: 'These inputs can be used to establish the foundations of a system even when there is no Figma file, website, or existing design system.' },

      { t: 'h3', v: 'You can start from more than one source' },
      { t: 'p', v: "These starting points aren't mutually exclusive." },
      { t: 'p', v: 'For example, a team might have both a Figma file and a live website. Using multiple sources can provide a broader view of the product and help establish a system that reflects what has actually been designed and built.' },
      { t: 'p', v: 'The important question is:' },
      { t: 'quote', v: 'What information already exists that can help define your design system?' },
      { t: 'p', v: 'The answer determines where you begin. From there, Strata helps turn that starting point into a structured system.' },
    ],
  },

  {
    id: 'how-strata-works',
    num: '05',
    title: 'How Strata Works',
    summary: 'Five stages, from your source to a system connected to development.',
    lede: 'Strata takes the information you already have, or the direction you want to establish, and turns it into a structured design system.',
    blocks: [
      { t: 'p', v: 'The process can be thought of as five stages:' },
      { t: 'pipeline', v: ['Start', 'Understand', 'Structure', 'Refine', 'Connect'] },
      { t: 'stages', v: [
        {
          num: '1',
          title: 'Start with your source',
          lines: [
            'Every design system begins with information.',
            'That information might come from a Figma file, a live website, an existing system, brand assets, or your own description of the product.',
            'You can also combine multiple sources when they are available.',
          ],
        },
        {
          num: '2',
          title: 'Understand the design language',
          lines: [
            'The information you provide contains patterns and decisions about how the product looks and works.',
            'Strata analyzes these inputs to identify the elements that can form part of a design system.',
            'Depending on the source, this can include things such as colors, typography, spacing, components, assets, and other reusable design properties.',
            'When starting without an existing design, your product and brand inputs provide the direction from which these foundations can be established.',
          ],
        },
        {
          num: '3',
          title: 'Structure the system',
          lines: [
            'The identified design decisions are organized into a system rather than remaining as disconnected information.',
            'Foundational values become tokens. Reusable interface elements become components. Visual resources become assets.',
            'Together, these form the building blocks of the design system.',
          ],
        },
        {
          num: '4',
          title: 'Review and refine',
          lines: [
            'A generated or imported system is a starting point, not necessarily the final version.',
            'You can review the decisions, identify anything that needs adjustment, and refine the system to better represent your product.',
            'This is important because a design system needs to reflect intentional decisions, not simply reproduce everything that happens to exist in a source.',
          ],
        },
        {
          num: '5',
          title: 'Connect the system to development',
          lines: [
            'A design system becomes more valuable when it can be used beyond the design environment.',
            'Strata connects the structured system to development so that the same design decisions can be used as part of the product-building workflow.',
            'This creates a bridge between what designers define and what developers implement.',
          ],
        },
      ] },

      { t: 'h3', v: 'The process is continuous' },
      { t: 'p', v: "These stages don't represent a one-time process." },
      { t: 'p', v: 'As the product changes, new decisions are introduced and existing ones evolve. The system can therefore move through the same cycle again:' },
      { t: 'pipeline', v: ['Start', 'Understand', 'Structure', 'Refine', 'Connect', 'Repeat'] },
      { t: 'p', v: 'The specific steps you take depend on where you are starting from and what already exists.' },
      { t: 'p', v: 'The next section looks more closely at what happens when that starting information is turned into the foundations of your system.' },
    ],
  },

  {
    id: 'building-your-system',
    num: '06',
    title: 'Building Your System',
    summary: 'Turning information into design decisions — and why the first version is a foundation.',
    lede: 'Once you have chosen where to start, the next step is turning that information into the foundations of a design system.',
    blocks: [
      { t: 'p', v: 'Strata looks at the information available from your chosen sources and identifies the design decisions that can be structured and reused.' },

      { t: 'h3', v: 'From information to design decisions' },
      { t: 'p', v: "The goal isn't simply to copy everything from a Figma file or website." },
      { t: 'p', v: "Instead, the information is used to identify the underlying decisions that define the product's visual language." },
      { t: 'p', v: 'These can include:' },
      { t: 'ul', v: ['Colors', 'Typography', 'Spacing', 'Sizing', 'Border radius', 'Shadows', 'Components', 'Assets', 'Other reusable interface properties'] },
      { t: 'p', v: 'The result is a structured representation of the design language already present in the product, or a foundation based on the direction you provide.' },

      { t: 'h3', v: 'Building the foundations' },
      { t: 'p', v: 'The identified decisions are organized into the different parts of the design system.' },
      { t: 'cards', v: [
        { title: 'Tokens', text: 'Capture reusable foundational values such as color, typography, and spacing.' },
        { title: 'Components', text: 'Represent reusable interface elements and their variations.' },
        { title: 'Assets', text: 'Contain visual resources such as logos, icons, and images.' },
      ] },
      { t: 'p', v: 'These pieces work together to form the foundation of the system.' },

      { t: 'h3', v: 'When starting from existing work' },
      { t: 'p', v: 'Existing designs and products often contain inconsistencies.' },
      { t: 'p', v: 'For example, the same color may appear in slightly different shades, or similar components may have been created with different properties.' },
      { t: 'p', v: 'Strata uses the available information to establish a structured system, but the resulting system still needs to reflect the decisions your team actually wants to keep.' },
      { t: 'p', v: 'This is why building and reviewing are connected.' },

      { t: 'h3', v: 'When starting from an idea' },
      { t: 'p', v: 'A system can also be created before a product has been fully designed.' },
      { t: 'p', v: 'In this case, the starting point is not existing design information. It is the direction you provide.' },
      { t: 'p', v: "Things such as the product's purpose, audience, personality, brand direction, color preferences, and desired experience can help establish the initial foundations." },
      { t: 'p', v: 'This gives a new product a design language to build from rather than developing every decision independently as the product grows.' },

      { t: 'h3', v: 'Building is not the same as finalizing' },
      { t: 'p', v: 'The first version of a design system should be treated as a foundation.' },
      { t: 'p', v: 'Some decisions may need to be changed. Some elements may not belong in the system. Others may need to be added as the product develops.' },
      { t: 'p', v: 'The purpose of this stage is to create a structured starting point that your team can evaluate and make intentional.' },
      { t: 'p', v: 'That leads to the next part of the process: reviewing and refining the system.' },
    ],
  },

  {
    id: 'reviewing-and-refining',
    num: '07',
    title: 'Reviewing & Refining',
    summary: 'Separating what is intentional and reusable from what is merely present.',
    lede: 'Building a design system gives you a structured starting point. Reviewing it is where you make sure that structure actually represents your product.',
    blocks: [
      { t: 'p', v: 'Whether the system came from existing designs, a website, or new product direction, the first version may contain decisions that need to be changed, removed, or expanded.' },

      { t: 'h3', v: 'Why review matters' },
      { t: 'p', v: 'Not everything found in a product should automatically become part of its design system.' },
      { t: 'p', v: 'A product may contain:' },
      { t: 'ul', v: ['One-off styles created for a specific screen', 'Duplicate or similar colors', 'Components with inconsistent variations', 'Outdated design decisions', 'Assets that are no longer in use'] },
      { t: 'p', v: 'A review helps separate what is intentional and reusable from what is simply present in the source.' },
      { t: 'p', v: 'The goal is not to reproduce the source exactly. It is to create a system that represents the design language your team wants to maintain.' },

      { t: 'h3', v: 'What you can review' },
      { t: 'p', v: 'Reviewing a system means looking at its different building blocks and asking whether they make sense together.' },
      { t: 'p', v: 'You might consider:' },
      { t: 'cards', v: [
        { title: 'Tokens', text: 'Are the colors, typography, spacing, and other values accurate and intentional?' },
        { title: 'Components', text: 'Are the reusable elements correctly represented? Do their variants and properties make sense?' },
        { title: 'Assets', text: 'Are the correct logos, icons, images, and other visual resources included?' },
        { title: 'Patterns and guidelines', text: 'Do the rules and relationships between these elements reflect how the product should be designed?' },
      ] },

      { t: 'h3', v: 'Refinement is about making decisions' },
      { t: 'p', v: "Reviewing isn't only about finding errors." },
      { t: 'p', v: 'It is also an opportunity to make deliberate choices about how the system should work.' },
      { t: 'p', v: 'You may decide to:' },
      { t: 'ul', v: ['Adjust a token', "Remove something that shouldn't be reusable", 'Add a missing element', 'Consolidate similar values', "Change a component's variation", 'Update an asset', 'Establish a clearer rule'] },
      { t: 'p', v: 'These decisions make the difference between a collection of extracted information and a design system that a team can confidently use.' },

      { t: 'h3', v: 'The system should reflect the product you want' },
      { t: 'p', v: 'There can be a difference between what currently exists and what the team wants to standardize.' },
      { t: 'p', v: "For example, a product might currently use three slightly different shades of the same color. Your design system doesn't necessarily need to preserve all three." },
      { t: 'p', v: 'The review process gives your team the opportunity to decide what should become part of the system going forward.' },

      { t: 'h3', v: 'Refinement continues over time' },
      { t: 'p', v: "Reviewing isn't something that happens only when a system is first created." },
      { t: 'p', v: 'As the product evolves, the system will need to evolve with it.' },
      { t: 'p', v: 'New components may be introduced. Existing ones may change. Tokens may be updated. Some elements may become obsolete.' },
      { t: 'p', v: 'A healthy design system is therefore one that can be reviewed and refined as the product changes.' },
    ],
  },

  {
    id: 'tokens-components-assets',
    num: '08',
    title: 'Tokens, Components & Assets',
    summary: 'The three core building blocks, and why keeping them distinct matters.',
    lede: 'Tokens, components, and assets are some of the core building blocks of a design system. They serve different purposes, but work together to create a consistent product.',
    blocks: [
      { t: 'h3', v: 'Tokens' },
      { t: 'p', v: 'Tokens are the reusable values that define the visual foundations of a product.' },
      { t: 'p', v: 'Common examples include:' },
      { t: 'ul', v: ['Colors', 'Typography', 'Spacing', 'Border radius', 'Shadows', 'Sizing'] },
      { t: 'p', v: 'Instead of treating these values as isolated properties, tokens give them a consistent name and structure so they can be reused across the system.' },
      { t: 'p', v: 'For example:' },
      { t: 'token', v: ['color.primary', 'spacing.medium', 'radius.large'] },
      { t: 'p', v: 'A change to a token can then be reflected wherever that token is used.' },

      { t: 'h3', v: 'Components' },
      { t: 'p', v: 'Components are reusable interface elements built from the foundations defined by the system.' },
      { t: 'p', v: 'Examples include:' },
      { t: 'ul', v: ['Buttons', 'Inputs', 'Cards', 'Modals', 'Dropdowns', 'Navigation', 'Forms'] },
      { t: 'p', v: 'A component can contain different variants, properties, and states.' },
      { t: 'p', v: 'For example, a button might have different sizes and visual variants, as well as states such as hover, disabled, or loading.' },
      { t: 'p', v: "Components turn the system's foundational decisions into things that can actually be used to build interfaces." },

      { t: 'h3', v: 'Assets' },
      { t: 'p', v: "Assets are the visual resources that support the product's interface and brand." },
      { t: 'p', v: 'These can include:' },
      { t: 'ul', v: ['Logos', 'Icons', 'Images', 'Illustrations', 'Other brand graphics'] },
      { t: 'p', v: "Unlike tokens and components, assets aren't necessarily rules or reusable interface structures. They are the visual resources that the product uses." },

      { t: 'h3', v: 'How they work together' },
      { t: 'p', v: 'These building blocks are connected.' },
      { t: 'flow', v: [
        { label: 'A token', text: 'might define the color used by a button.' },
        { label: 'A component', text: 'uses that token as part of its visual definition.' },
        { label: 'An asset', text: 'such as an icon might be included inside that component.' },
      ] },
      { t: 'p', v: 'This relationship allows the system to maintain consistency at different levels, from individual visual values to complete interface elements.' },

      { t: 'h3', v: 'Why the distinction matters' },
      { t: 'p', v: 'Keeping these elements organized by their role makes a design system easier to understand and maintain.' },
      { t: 'p', v: 'When a designer or developer needs to change a foundational value, they can work with the relevant token.' },
      { t: 'p', v: 'When they need to build an interface, they can use an existing component.' },
      { t: 'p', v: 'When they need a brand or visual resource, they can access the appropriate asset.' },
      { t: 'p', v: 'Together, these building blocks turn the design system into something that can be reused across the product rather than simply documented.' },
    ],
  },

  {
    id: 'from-design-to-development',
    num: '09',
    title: 'From Design to Development',
    summary: 'One system, two environments — and why the connection matters.',
    lede: 'A design system becomes more valuable when it can be used beyond the design process.',
    blocks: [
      { t: 'p', v: 'Designers and developers need to work from the same decisions when turning an interface into a working product. Without that connection, the system defined in design can gradually differ from what is implemented in code.' },
      { t: 'p', v: 'Strata helps bridge that gap by making the design system usable within the development workflow.' },

      { t: 'h3', v: 'One system, two environments' },
      { t: 'p', v: 'Designers may work with tokens, components, and assets in their design environment, while developers need those same decisions in a form they can use in code.' },
      { t: 'p', v: 'The underlying system should remain consistent across both.' },
      { t: 'p', v: 'For example, a primary brand color defined as a token in the design system should not need to be independently recreated by a developer with a different value.' },
      { t: 'p', v: 'The same applies to typography, spacing, component properties, and other system decisions.' },

      { t: 'h3', v: 'From design decisions to code' },
      { t: 'p', v: 'The design system provides the source for the decisions developers need when building the product.' },
      { t: 'p', v: 'This can include:' },
      { t: 'ul', v: ['Design tokens and their values', 'Component definitions', 'Component properties and variations', 'Assets', 'Other reusable system information'] },
      { t: 'p', v: 'Developers can then use these definitions as part of the implementation rather than recreating the design language from individual screens.' },

      { t: 'h3', v: 'Why this connection matters' },
      { t: 'p', v: 'When design and development work from the same system:' },
      { t: 'ul', v: ['Designers and developers have a shared reference', "Reusable decisions don't have to be recreated repeatedly", 'Changes to the system can be carried into implementation', 'Products are more likely to remain visually consistent', 'The gap between design and implementation becomes smaller'] },
      { t: 'p', v: 'This does not mean every design decision is automatically implemented in code.' },
      { t: 'p', v: "The design system provides the shared foundation, while developers still determine how that foundation is implemented within the product's technical architecture." },

      { t: 'h3', v: 'The design system as a shared source' },
      { t: 'p', v: 'The most useful design system is one that both designers and developers can rely on.' },
      { t: 'p', v: 'Designers use it to create interfaces from established decisions. Developers use it to implement those decisions consistently.' },
      { t: 'p', v: 'When both sides work from the same system, the design system becomes more than a reference for design. It becomes a shared foundation for building the product.' },
      { t: 'p', v: 'And because products continue to change, that shared foundation also needs to stay current.' },
      { t: 'p', v: 'That is where keeping the system in sync becomes important.' },
    ],
  },

  {
    id: 'keeping-your-system-in-sync',
    num: '10',
    title: 'Keeping Your System in Sync',
    summary: 'Why systems drift, and what keeping one current actually involves.',
    lede: 'A design system is only useful when it continues to reflect the product it supports.',
    blocks: [
      { t: 'p', v: 'As a product changes, the decisions behind it change too. New components are introduced, existing ones evolve, tokens are updated, and assets are replaced.' },
      { t: 'p', v: "If those changes aren't reflected in the design system, the system can gradually become disconnected from the product." },

      { t: 'h3', v: 'Why systems fall out of sync' },
      { t: 'p', v: "Design and development don't always change at the same time." },
      { t: 'p', v: 'A designer may update a component without the corresponding implementation being updated. A developer may introduce a new pattern that never makes its way back into the design system. A brand change may also affect tokens and assets across the product.' },
      { t: 'p', v: 'Over time, these differences accumulate.' },
      { t: 'p', v: 'The result can be multiple versions of what is supposed to be the same system.' },

      { t: 'h3', v: 'Keeping the system current' },
      { t: 'p', v: 'Keeping a system in sync means maintaining alignment between the system and the product as both evolve.' },
      { t: 'p', v: 'This can involve:' },
      { t: 'ul', v: ['Updating tokens when foundational values change', 'Adding new components when they become part of the product', 'Updating existing components when their design or behavior changes', 'Replacing outdated assets', 'Removing elements that are no longer relevant', 'Ensuring design and development are working from the same definitions'] },
      { t: 'p', v: "The goal isn't to update the system after every small change." },
      { t: 'p', v: 'The goal is to make sure the system remains an accurate representation of the decisions the team intends to reuse.' },

      { t: 'h3', v: 'Sync is a continuous process' },
      { t: 'p', v: 'There is no final point at which a design system is permanently complete.' },
      { t: 'p', v: 'A change to the product can create a change in the system, and a change in the system can influence future product work.' },
      { t: 'p', v: 'This makes maintaining the system an ongoing part of the product development process rather than a separate task that happens once.' },

      { t: 'h3', v: 'Keeping everyone aligned' },
      { t: 'p', v: 'A well-maintained system gives the team a shared reference for current design decisions.' },
      { t: 'p', v: 'Designers can build with the same foundations. Developers can implement against the same definitions.' },
      { t: 'p', v: 'New team members can understand the decisions behind the product without relying entirely on individual team members to explain them.' },
      { t: 'p', v: 'The result is a system that stays useful as the product grows, rather than becoming a record of how the product used to be designed.' },
    ],
  },

  {
    id: 'common-questions',
    num: '11',
    title: 'Common Questions',
    summary: 'What Strata needs from you, what it decides, and what it does not replace.',
    lede: 'Some of the questions that often come up when thinking about Strata and design systems.',
    blocks: [
      { t: 'qa', v: [
        { q: 'Do I need a Figma file to use Strata?', short: 'No.', a: ["Figma is one possible starting point, but it isn't required.", 'You can also start with a website, an existing design system, brand information, or your own description of the product and the design direction you want to establish.'] },
        { q: 'Do I need an existing design system?', short: 'No.', a: ['Strata can be used when you already have a system that you want to structure and manage, or when you are creating one for the first time.'] },
        { q: 'Can I use both Figma and my website?', short: 'Yes.', a: ["When multiple sources are available, they can provide additional context about the product's design language.", 'For example, Figma may represent the intended design while the website shows what is currently implemented.'] },
        { q: 'Does Strata decide how my product should look?', short: 'No.', a: ['Strata can help establish and structure design decisions, but your team remains responsible for deciding what is right for the product.', 'The resulting system should reflect your brand, product requirements, and design choices.'] },
        { q: 'Does everything from my source become part of the design system?', short: 'Not necessarily.', a: ['Existing designs and products may contain one-off decisions, inconsistencies, or outdated elements.', 'The purpose of reviewing and refining the system is to decide what should actually become part of the reusable system.'] },
        { q: 'Can I change the system after it has been created?', short: 'Yes.', a: ['A design system is expected to evolve. Tokens, components, assets, and other system elements can be refined as your product and design direction change.'] },
        { q: 'Is Strata only for designers?', short: 'No.', a: ['While design is an important part of the system, Strata is intended to create a shared foundation that can also support developers and other people involved in building the product.'] },
        { q: 'Does Strata replace Figma?', short: 'No.', a: ['Figma and Strata serve different purposes.', 'Figma is a design and prototyping environment. Strata focuses on structuring and managing the design system that supports the product.'] },
        { q: 'Does Strata automatically build my entire product?', short: 'No.', a: ['Strata helps create and manage the design system that supports product development. It does not replace the design, engineering, or product work required to build the product itself.'] },
        { q: 'What if my product changes after I create my system?', short: "That's expected.", a: ['A design system should evolve alongside the product. Changes can be reflected in the system so that it continues to represent the decisions your team wants to maintain.'] },
        { q: "What if I don't know how to build a design system?", short: "You don't need to have everything figured out before you start.", a: ['You can begin with whatever information or direction you already have and develop the system through the process of reviewing and refining it.'] },
      ] },
    ],
  },

  {
    id: 'getting-started',
    num: '12',
    title: 'Getting Started',
    summary: 'Where to go next.',
    lede: 'The practical side of using Strata: creating a project, and connecting the system you build to your code.',
    // This chapter is navigation rather than doctrine. The guide the rest of this page is
    // written from ends at the heading "Getting Started" with no body, so rather than
    // inventing prose and attributing it to the guide, this points at the two places in
    // the product that actually carry the steps.
    blocks: [
      { t: 'p', v: 'Every earlier chapter describes the thinking. These are the two places in Strata where it turns into work.' },
      { t: 'links', v: [
        { to: '/projects/new', title: 'Create a project', text: 'Choose your starting point — Figma, a website, an existing system, or a description of the product — and build the foundations from it.' },
        { to: '/docs', title: 'Read the developer docs', text: 'Install the package, wrap your app, and use the tokens and components your system defines.' },
        { to: '/explore', title: 'Look at a real system first', text: 'Browse published systems to see how tokens, components, and assets sit together before building your own.' },
      ] },
      { t: 'p', v: 'You do not need a finished design system to begin. Start with what exists, and refine it from there.' },
    ],
  },
];

/** The table of contents reads from the chapters, so it can never list a chapter that is not there. */
export const LEARN_TOC = LEARN_CHAPTERS.map(({ id, num, title }) => ({ id, num, title }));
