import UserProfileCard from "./UserProfileCard";

const user = {
  id: "user-1",
  email: "student@example.com",
  user_metadata: {
    display_name: "Student",
    avatar_path: null,
  },
};

export default {
  title: "Components/UserProfileCard",
  component: UserProfileCard,
};

export const Guest = {
  render: () => <UserProfileCard user={null} isLoggedIn={false} signOut={() => ({})} />,
};

export const LoggedIn = {
  render: () => (
    <UserProfileCard
      user={user}
      isLoggedIn
      signOut={() => Promise.resolve({ error: null })}
    />
  ),
};
