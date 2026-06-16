/**
 * KanaKeyboard
 * 屏幕罗马字键盘（QWERTY 26 键，类 iOS 日文罗马字输入），输入 romaji 由父组件转假名。
 * 仅 3+ 行，高度紧凑，桌面与移动端通用，不出现滚动条。
 *
 *   onLetter(ch)   输入一个字母
 *   onLongVowel()  输入长音 ー
 *   onBackspace()  退格
 */

import React from "react";
import styled from "styled-components";

const ROW1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROW3 = ["z", "x", "c", "v", "b", "n", "m"];

export default function KanaKeyboard({ onLetter, onLongVowel, onBackspace, disabled }) {
  function hold(e) {
    e.preventDefault(); // 不抢走当前选中输入格的焦点
  }

  return (
    <Board onMouseDown={hold} aria-label="罗马字键盘">
      <Row>
        {ROW1.map((ch) => (
          <Key key={ch} type="button" disabled={disabled} onClick={() => onLetter(ch)}>
            {ch}
          </Key>
        ))}
      </Row>
      <Row $inset="0.5">
        {ROW2.map((ch) => (
          <Key key={ch} type="button" disabled={disabled} onClick={() => onLetter(ch)}>
            {ch}
          </Key>
        ))}
      </Row>
      <Row>
        <WideKey type="button" disabled={disabled} onClick={onLongVowel} aria-label="长音">
          ー
        </WideKey>
        {ROW3.map((ch) => (
          <Key key={ch} type="button" disabled={disabled} onClick={() => onLetter(ch)}>
            {ch}
          </Key>
        ))}
        <WideKey type="button" disabled={disabled} onClick={onBackspace} aria-label="退格">
          ⌫
        </WideKey>
      </Row>
    </Board>
  );
}

const Board = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  box-shadow: var(--shadow-sm);
  user-select: none;
`;
const Row = styled.div`
  display: flex;
  gap: 0.28rem;
  ${(p) => p.$inset && `padding: 0 calc(${p.$inset} * (100% / 10));`}

  @media (min-width: 550px) {
    gap: 0.4rem;
  }
`;
const keyBase = `
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 90ms ease, transform 60ms ease;

  @media (min-width: 550px) {
    height: 2.8rem;
    font-size: 1.15rem;
  }

  &:active {
    transform: translateY(1px);
    background-color: var(--accent);
    color: hsl(40deg 36% 99%);
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
const Key = styled.button`
  ${keyBase}
  color: var(--text);
  background-color: var(--gray95);
  border: 1px solid var(--border);
  text-transform: uppercase;
  &:hover {
    background-color: var(--accent-soft);
    border-color: var(--accent);
  }
`;
const WideKey = styled.button`
  ${keyBase}
  flex: 1.4 1 0;
  color: var(--accent-strong);
  background-color: var(--accent-soft);
  border: 1px solid transparent;
  &:hover {
    border-color: var(--accent);
  }
`;
