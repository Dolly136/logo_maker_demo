import React from "react";

const shortcuts = {
  duplicate: "Ctrl+D",
  copy: "Ctrl+C",
  lock: "Ctrl+L",
  flipH: "Ctrl+F",
  flipV: "Ctrl+Shift+F",
  rotateLeft: "Ctrl+Shift+R",
  rotateRight: "Ctrl+R",
  forward: "Ctrl+Shift+Up",
  backward: "Ctrl+Shift+Down",
  delete: "Del",
};

const ContextRightClick = ({
  contextMenu,
  handleContextMenuDuplicate,
  setContextMenu,
  handleContextMenuCopy,
  handleContextMenuLock,
  lockedLayers,
  handleContextMenuFlip,
  handleContextMenuRotate,
  handleContextMenuDelete,
  bringLayerForward,
  sendLayerBackward
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: contextMenu.y,
        left: contextMenu.x,
        zIndex: 2000,
        background: "white",
        border: "1px solid #ccc",
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        minWidth: 200,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={() => {
          handleContextMenuDuplicate();
          setContextMenu({ ...contextMenu, visible: false });
        }}
      >
        <span>Duplicate</span>
        <span className="text-xs text-gray-500">{shortcuts.duplicate}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={() => {
          handleContextMenuCopy();
          setContextMenu({ ...contextMenu, visible: false });
        }}
      >
        <span>Copy</span>
        <span className="text-xs text-gray-500">{shortcuts.copy}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={handleContextMenuLock}
      >
        <span>{lockedLayers[contextMenu.layerId] ? "Unlock" : "Lock"}</span>
        <span className="text-xs text-gray-500">{shortcuts.lock}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={() => handleContextMenuFlip(true)}
      >
        <span>Flip Horizontally</span>
        <span className="text-xs text-gray-500">{shortcuts.flipH}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={() => handleContextMenuFlip(false)}
      >
        <span>Flip Vertically</span>
        <span className="text-xs text-gray-500">{shortcuts.flipV}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={() => handleContextMenuRotate("left")}
      >
        <span>Rotate Left</span>
        <span className="text-xs text-gray-500">{shortcuts.rotateLeft}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={() => handleContextMenuRotate("right")}
      >
        <span>Rotate Right</span>
        <span className="text-xs text-gray-500">{shortcuts.rotateRight}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={bringLayerForward}
      >
        <span>Bring Forward</span>
        <span className="text-xs text-gray-500">{shortcuts.forward}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100 flex justify-between"
        onClick={sendLayerBackward}
      >
        <span>Bring Backward</span>
        <span className="text-xs text-gray-500">{shortcuts.backward}</span>
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 flex justify-between"
        onClick={handleContextMenuDelete}
      >
        <span>Delete Layer</span>
        <span className="text-xs text-gray-500">{shortcuts.delete}</span>
      </button>
    </div>
  );
};

export default ContextRightClick;