import React from "react";

const ContextRightClick = ({
  contextMenu,
  handleContextMenuDuplicate,
  setContextMenu,
  handleContextMenuCopy,
  handleContextMenuLock,
  lockedLayers,
  handleContextMenuFlip,
  handleContextMenuRotate,
  handleContextMenuDelete
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
        minWidth: 180,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100"
        onClick={() => {
          handleContextMenuDuplicate();
          setContextMenu({ ...contextMenu, visible: false });
        }}
      >
        Duplicate
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100"
        onClick={() => {
          handleContextMenuCopy();
          setContextMenu({ ...contextMenu, visible: false });
        }}
      >
        Copy
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100"
        onClick={handleContextMenuLock}
      >
        {lockedLayers[contextMenu.layerId] ? "Unlock" : "Lock"}
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100"
        onClick={() => handleContextMenuFlip(true)}
      >
        Flip Horizontally
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100"
        onClick={() => handleContextMenuFlip(false)}
      >
        Flip Vertically
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100"
        onClick={() => handleContextMenuRotate("left")}
      >
        Rotate Left
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-blue-100"
        onClick={() => handleContextMenuRotate("right")}
      >
        Rotate Right
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
        onClick={handleContextMenuDelete}
      >
        Delete Layer
      </button>
    </div>
  );
};

export default ContextRightClick;
