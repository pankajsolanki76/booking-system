export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

/**
 * Generates a unique slug by appending a counter if the base slug already exists.
 * @param title The base string to slugify
 * @param checkExists A callback that returns true if the slug exists, or false if it is unique
 * @returns A unique slug string
 */
export async function generateUniqueSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let exists = await checkExists(slug);
  let counter = 1;

  while (exists) {
    slug = `${baseSlug}-${counter}`;
    exists = await checkExists(slug);
    counter++;
  }

  return slug;
}