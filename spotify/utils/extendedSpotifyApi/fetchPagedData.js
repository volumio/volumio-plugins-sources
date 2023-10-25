const limit = 50;

async function fetchPagedData(
  api,
  method,
  { requiredArgs = [], options, paginationType = 'offset' },
  { getItems = (d) => d.body?.items || [], onData, onEnd }
) {
  let offset = 0;
  let after = undefined;

  const nextPage = {
    offset: () => (offset += limit),
    after: (items) => (after = items[items.length - 1].id),
  };

  while (true) {
    const data = await api[method](...[...requiredArgs, { ...options, limit, offset, after }]);
    const items = getItems(data);
    if (!items.length) {
      onEnd();
      break;
    }
    onData(items);
    if (items.length < limit) {
      onEnd();
      break;
    }
    nextPage[paginationType](items);
  }
}

module.exports.fetchPagedData = fetchPagedData;
