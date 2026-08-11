import { fade, slide } from "astro:transitions";

export const customFade = fade({ duration: "350ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
export const customSlide = slide({ duration: "400ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" });

export const morphTransition = {
  forwards: {
    old: [
      { name: "morph-out", duration: "400ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      { name: "fade-out", duration: "200ms", easing: "ease-out" }
    ],
    new: [
      { name: "morph-in", duration: "500ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      { name: "fade-in", duration: "300ms", easing: "ease-out", delay: "100ms" }
    ]
  },
  backwards: {
    old: [
      { name: "morph-out", duration: "400ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)", direction: "reverse" },
      { name: "fade-out", duration: "200ms", easing: "ease-out" }
    ],
    new: [
      { name: "morph-in", duration: "500ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", direction: "reverse" },
      { name: "fade-in", duration: "300ms", easing: "ease-out", delay: "100ms" }
    ]
  }
};

export const scaleTransition = {
  forwards: {
    old: [
      { name: "scale-out", duration: "300ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      { name: "fade-out", duration: "200ms", easing: "ease-out" }
    ],
    new: [
      { name: "scale-in", duration: "450ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      { name: "fade-in", duration: "300ms", easing: "ease-out", delay: "50ms" }
    ]
  },
  backwards: {
    old: [
      { name: "scale-out", duration: "300ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)", direction: "reverse" },
      { name: "fade-out", duration: "200ms", easing: "ease-out" }
    ],
    new: [
      { name: "scale-in", duration: "450ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", direction: "reverse" },
      { name: "fade-in", duration: "300ms", easing: "ease-out", delay: "50ms" }
    ]
  }
};

export const heroTransition = {
  forwards: {
    old: [
      { name: "hero-slide-up-out", duration: "400ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      { name: "fade-out", duration: "250ms", easing: "ease-out" }
    ],
    new: [
      { name: "hero-slide-up-in", duration: "600ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      { name: "fade-in", duration: "400ms", easing: "ease-out", delay: "150ms" }
    ]
  },
  backwards: {
    old: [
      { name: "hero-slide-up-out", duration: "400ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)", direction: "reverse" },
      { name: "fade-out", duration: "250ms", easing: "ease-out" }
    ],
    new: [
      { name: "hero-slide-up-in", duration: "600ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", direction: "reverse" },
      { name: "fade-in", duration: "400ms", easing: "ease-out", delay: "150ms" }
    ]
  }
};

export const cardStaggerTransition = {
  forwards: {
    old: [{ name: "card-stagger-out", duration: "300ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" }],
    new: [{ name: "card-stagger-in", duration: "500ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }]
  },
  backwards: {
    old: [{ name: "card-stagger-out", duration: "300ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)", direction: "reverse" }],
    new: [{ name: "card-stagger-in", duration: "500ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", direction: "reverse" }]
  }
};

export const pageTransition = {
  forwards: {
    old: [
      { name: "page-slide-left-out", duration: "350ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      { name: "fade-out", duration: "200ms", easing: "ease-out" }
    ],
    new: [
      { name: "page-slide-right-in", duration: "450ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      { name: "fade-in", duration: "300ms", easing: "ease-out", delay: "50ms" }
    ]
  },
  backwards: {
    old: [
      { name: "page-slide-right-out", duration: "350ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      { name: "fade-out", duration: "200ms", easing: "ease-out" }
    ],
    new: [
      { name: "page-slide-left-in", duration: "450ms", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      { name: "fade-in", duration: "300ms", easing: "ease-out", delay: "50ms" }
    ]
  }
};