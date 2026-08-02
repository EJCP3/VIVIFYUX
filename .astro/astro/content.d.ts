declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"librerias": {
"balloons.md": {
	id: "balloons.md";
  slug: "balloons";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"beam.md": {
	id: "beam.md";
  slug: "beam";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"bklit.md": {
	id: "bklit.md";
  slug: "bklit";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"calligraph.md": {
	id: "calligraph.md";
  slug: "calligraph";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"canvas-ui.md": {
	id: "canvas-ui.md";
  slug: "canvas-ui";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"cuelume.md": {
	id: "cuelume.md";
  slug: "cuelume";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"deltached.md": {
	id: "deltached.md";
  slug: "deltached";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"feralui.md": {
	id: "feralui.md";
  slug: "feralui";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"glass.md": {
	id: "glass.md";
  slug: "glass";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"glimm.md": {
	id: "glimm.md";
  slug: "glimm";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"gsap.md": {
	id: "gsap.md";
  slug: "gsap";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"lenis.md": {
	id: "lenis.md";
  slug: "lenis";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"liquid-glass.md": {
	id: "liquid-glass.md";
  slug: "liquid-glass";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"math-curve-loaders.md": {
	id: "math-curve-loaders.md";
  slug: "math-curve-loaders";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"metal.md": {
	id: "metal.md";
  slug: "metal";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"motion-core.md": {
	id: "motion-core.md";
  slug: "motion-core";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"motion.md": {
	id: "motion.md";
  slug: "motion";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"oreo-avatar.md": {
	id: "oreo-avatar.md";
  slug: "oreo-avatar";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"pocoloco.md": {
	id: "pocoloco.md";
  slug: "pocoloco";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"react-bits.md": {
	id: "react-bits.md";
  slug: "react-bits";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"sileo.md": {
	id: "sileo.md";
  slug: "sileo";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"slither-charts.md": {
	id: "slither-charts.md";
  slug: "slither-charts";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"slot-text.md": {
	id: "slot-text.md";
  slug: "slot-text";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"soundcn.md": {
	id: "soundcn.md";
  slug: "soundcn";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"theme-toggle.md": {
	id: "theme-toggle.md";
  slug: "theme-toggle";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"thinking-orbs.md": {
	id: "thinking-orbs.md";
  slug: "thinking-orbs";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"transitions.md": {
	id: "transitions.md";
  slug: "transitions";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"uiverse.md": {
	id: "uiverse.md";
  slug: "uiverse";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"watermelon.md": {
	id: "watermelon.md";
  slug: "watermelon";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
"wissfort.md": {
	id: "wissfort.md";
  slug: "wissfort";
  body: string;
  collection: "librerias";
  data: InferEntrySchema<"librerias">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
