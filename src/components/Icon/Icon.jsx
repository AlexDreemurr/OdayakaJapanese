import React from "react";
import styled from "styled-components";
import { ChevronDown, Menu, X } from "react-feather";
import {
  ArrowUpDown,
  ArrowDownAZ,
  ArrowDownZA,
  Languages,
  User,
  Clock,
  MessagesSquare,
  ArrowLeft,
  SquareCheck,
  Info,
  FolderPlus,
  SquareMousePointer,
  Trash2,
  SquarePen,
  Undo2,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Award,
  ArrowDownWideNarrow,
  ArrowDownNarrowWide,
  Search,
  Plus,
  Volume2,
  LoaderCircle,
} from "lucide-react";

const icons = {
  menu: Menu,
  close: X,
  ArrowDownAZ,
  ArrowDownZA,
  Languages,
  ArrowUpDown,
  user: User,
  clock: Clock,
  message: MessagesSquare,
  arrowLeft: ArrowLeft,
  squareCheck: SquareCheck,
  info: Info,
  folderPlus: FolderPlus,
  select: SquareMousePointer,
  remove: Trash2,
  edit: SquarePen,
  undo: Undo2,
  public: Globe,
  private: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  star: Star,
  starOff: StarOff,
  award: Award,
  search: Search,
  arrowWideNarrowDown: ArrowDownWideNarrow,
  arrowNarrowWideDown: ArrowDownNarrowWide,
  arrowDownWideNarrow: ArrowDownWideNarrow,
  arrowDownNarrowWide: ArrowDownNarrowWide,
  plus: Plus,
  volume: Volume2,
  loader: LoaderCircle,
  "chevron-down": ChevronDown,
};

const Icon = ({ id, color, size, strokeWidth, ...delegated }) => {
  const Component = icons[id];

  if (!Component) {
    throw new Error(`No icon found for ID: ${id}`);
  }

  return (
    <Wrapper strokeWidth={strokeWidth} {...delegated}>
      <Component color={color} size={size} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  & > svg {
    display: block;
    stroke-width: ${(p) =>
      p.strokeWidth !== undefined ? p.strokeWidth + "px" : undefined};
  }
`;

export default Icon;
