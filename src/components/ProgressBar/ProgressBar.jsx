import React from "react";
import styled from "styled-components";
import VisuallyHidden from "../VisuallyHidden/VisuallyHidden";

const STYLES = {
  small: {
    height: 8,
    padding: 0,
    radius: 4,
  },
  medium: {
    height: 12,
    padding: 0,
    radius: 4,
  },
  large: {
    height: 16,
    padding: 4,
    radius: 8,
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const ProgressBar = ({ value, size, onChange, ariaLabel }) => {
  const barRef = React.useRef(null);
  const styles = STYLES[size];
  const safeValue = clamp(value, 0, 100);
  const isInteractive = typeof onChange === "function";

  if (!styles) {
    throw new Error(
      `Unrecognized size: ${size}, valid sizes: small/medium/large.`
    );
  }

  function updateValueFromPointer(event) {
    const rect = barRef.current.getBoundingClientRect();
    const nextValue = ((event.clientX - rect.left) / rect.width) * 100;
    onChange(clamp(nextValue, 0, 100));
  }

  function handlePointerDown(event) {
    if (!isInteractive) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    updateValueFromPointer(event);
  }

  function handlePointerMove(event) {
    if (
      !isInteractive ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    updateValueFromPointer(event);
  }

  function handleKeyDown(event) {
    if (!isInteractive) {
      return;
    }

    const step = event.shiftKey ? 10 : 1;

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(clamp(safeValue - step, 0, 100));
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(clamp(safeValue + step, 0, 100));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(100);
    }
  }

  return (
    <Wrapper
      style={{
        "--padding": styles.padding + "px",
        "--radius": styles.radius + "px",
      }}
      role={isInteractive ? "slider" : "progressbar"}
      aria-label={ariaLabel}
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <BarWrapper
        ref={barRef}
        data-interactive={isInteractive}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <VisuallyHidden>{`${Math.round(safeValue)}%`}</VisuallyHidden>
        <Bar
          style={{
            "--height": styles.height + "px",
            "--width": safeValue + "%",
          }}
        />
        {isInteractive && (
          <Thumb
            style={{
              "--size": Math.max(styles.height + 8, 18) + "px",
              "--left": safeValue + "%",
            }}
          />
        )}
      </BarWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: var(--padding);
  border-radius: var(--radius);
  background-color: var(--gray85);
  box-shadow: inset 0px 2px 4px var(--gray60);
`;

const BarWrapper = styled.div`
  position: relative;
  border-radius: 4px;
  cursor: default;

  &[data-interactive="true"] {
    cursor: pointer;
    touch-action: none;
  }
`;

const Bar = styled.div`
  width: var(--width);
  height: var(--height);
  background-color: var(--gray15);
  border-radius: inherit;
`;

const Thumb = styled.div`
  position: absolute;
  top: 50%;
  left: var(--left);
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  border: 2px solid var(--gray15);
  background-color: var(--gray95);
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

export default ProgressBar;
