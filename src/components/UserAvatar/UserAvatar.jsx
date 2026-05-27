import styled from "styled-components";
import * as Avatar from "@radix-ui/react-avatar";
import { UserRound } from "lucide-react";
import { getAvatarUrl } from "../../constants/avatarOptions";

const SIZES = {
  small: "2rem",
  default: "3.25rem",
  large: "5.5rem",
};

function UserAvatar({
  avatarPath,
  src,
  alt = "用户头像",
  size = "default",
  selected = false,
  ...delegated
}) {
  const dimension = SIZES[size] ?? SIZES.default;
  const imageSrc = src ?? getAvatarUrl(avatarPath);

  return (
    <Root
      $size={dimension}
      $selected={selected}
      $hasImage={Boolean(imageSrc)}
      data-selected={selected}
      {...delegated}
    >
      {imageSrc ? (
        <>
          <Image src={imageSrc} alt={alt} />
          <Fallback delayMs={300}>
            <FallbackIcon />
          </Fallback>
        </>
      ) : (
        <FallbackContent aria-label={alt}>
          <FallbackIcon />
        </FallbackContent>
      )}
    </Root>
  );
}

const Root = styled(Avatar.Root)`
  --avatar-size: ${({ $size }) => $size};

  display: inline-flex;
  width: var(--avatar-size);
  height: var(--avatar-size);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid var(--gray60);
  background: ${({ $hasImage }) =>
    $hasImage ? "var(--gray95)" : "var(--gray85)"};
  box-shadow: ${({ $selected }) =>
    $selected
      ? "0 0 0 2px var(--gray95), 0 0 0 5px var(--green15)"
      : "0 1px 3px var(--transparentGray15)"};
`;

const Image = styled(Avatar.Image)`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
`;

const Fallback = styled(Avatar.Fallback)`
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--gray40);
  background: var(--gray85);
`;

const FallbackContent = styled.span`
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--gray40);
  background: var(--gray85);
`;

const FallbackIcon = styled(UserRound).attrs({
  size: "48%",
  strokeWidth: 1.9,
})`
  display: block;
  color: var(--gray40);
  stroke: currentColor;
`;

export default UserAvatar;
