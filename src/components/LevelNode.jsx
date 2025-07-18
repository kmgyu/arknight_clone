import React from 'react';

function LevelNode({ node, onClick }) {
  return (
    <div
      className={`graph-node type-${node.type.toLowerCase()}`}
      // style={{ left: node.x, top: node.y }}
      onClick={onClick}
    >
      {node.label}
    </div>
  );
}

export default LevelNode;
