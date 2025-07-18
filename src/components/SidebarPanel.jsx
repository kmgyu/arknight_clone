function SidebarPanel({ node, onClose }) {
  if (!node) return null;

  return (
    <div className="sidebar-panel">
      <button onClick={onClose}>닫기</button>
      <h3>{node.label}</h3>
      <p>타입: {node.type}</p>
      <p>설명: 노드에 대한 상세 정보</p>
    </div>
  );
}

export default SidebarPanel;
