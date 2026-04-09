export function runSimulation(nodes, edges, onStep, onComplete) {
  const edgeMap = {};
  edges.forEach(e => { edgeMap[e.source] = e.target; });

  const startNode = nodes.find(n => n.type === 'startNode');
  if (!startNode) return;

  const order = [];
  let current = startNode.id;
  while (current) {
    const node = nodes.find(n => n.id === current);
    if (node) order.push(node);
    current = edgeMap[current];
  }

  let i = 0;
  const interval = setInterval(() => {
    if (i >= order.length) {
      clearInterval(interval);
      onComplete();
      return;
    }
    onStep(order[i]);
    i++;
  }, 1400);

  return interval;
}