export function buildCharactersTooltipDict(item) {
  const dict = {};

  if (!item || !Array.isArray(item.subregions)) {
    return dict;
  }

  item.subregions.forEach((sr) => {
    sr.positions.forEach((p) => {
      if (!dict[p]) {
        dict[p] = sr.bindingEnergy != null
          ? `<b style='color:${sr.color}'>${sr.name}</b> <br> Binding: ${sr.bindingEnergy.toFixed(2)}  <i>k</i><sub>B</sub><i>T</i> (${sr.source})`
          : `<b style='color:${sr.color}'>${sr.name}</b>`;
      }
    });
  });

  return dict;
}

export function enrichSequenceResultList(resultList = []) {
  return resultList.map((item) => ({
    ...item,
    charactersTooltipDict: item.charactersTooltipDict || buildCharactersTooltipDict(item),
  }));
}
