const accountParameterMapping: { [key: string]: { [key: string]: string } } = {
  '944997240237': {
    branch: 'main',
  },
};

export function getCfg(
  accountId: string | undefined,
  paramName: string,
): string {
  if (accountId === undefined) {
    throw new Error('accountId is undefined');
  }
  return accountParameterMapping[accountId][paramName];
}
