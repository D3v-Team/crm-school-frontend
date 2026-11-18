/* eslint-disable react/prop-types */
import { UserDeleteButton } from "../../Shared/UserDeleteDialog";

export default function Delete({ user }) {
    if (user && ["super_admin", "parent"].includes(user.role)) return null;
    return <UserDeleteButton user={user} subject="foydalanuvchini" />;
}
