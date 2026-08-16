import artwork1 from "../../public/artwork_1.webp";
import artwork11 from "../../public/artwork_11.webp";
import artwork13 from "../../public/artwork_13.webp";
import artwork2 from "../../public/artwork_2.webp";
import artwork3 from "../../public/artwork_3.webp";
import artwork6 from "../../public/artwork_6.webp";
import artwork7 from "../../public/artwork_7.webp";
import artwork8 from "../../public/artwork_8.webp";

/** Static imports enable immutable hashed caching in production builds. */
export const productArtwork = {
  artwork1,
  artwork2,
  artwork3,
  artwork6,
  artwork7,
  artwork8,
  artwork11,
  artwork13,
} as const;
