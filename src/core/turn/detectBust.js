export function detectBust(
  scoringOptions,
  {
    hasAlternativeAction = false,
  } = {},
) {
  if (
    !Array.isArray(
      scoringOptions,
    )
  ) {
    throw new TypeError(
      'scoringOptions muss ein Array sein.',
    );
  }

  return (
    scoringOptions.length === 0 &&
    !hasAlternativeAction
  );
}