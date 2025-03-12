export const truncate = (str: string, length: number): string => {
  if (str.length <= length) {
    return str;
  }
  return `${str.slice(0, length)}...`;
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};
