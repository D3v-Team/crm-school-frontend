/* eslint-disable react/prop-types */
import { UserDeleteButton } from "../../Shared/UserDeleteDialog";

/* Ota-ona arxivlanadi va farzandlaridan uziladi; farzandlarning ma'lumotlari saqlanadi. */
export default function Delete({ user }) {
    return (
        <UserDeleteButton
            user={user}
            subject="ota-onani"
            extra={<p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "4px 0 0" }}>Farzandlari bu ota-onadan uziladi.</p>}
        />
    );
}
