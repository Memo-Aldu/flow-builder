export const waitFor = (timeout = 10000) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};
