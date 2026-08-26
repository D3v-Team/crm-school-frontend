// TeacherProfile.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "../../../store/services/user.api";
import { useGetSubjectsQuery } from "../../../store/services/subject.api";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  CreditCard,
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  ListChecks,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import { Alert } from "../../Other/UI/Alert/Alert";

import ProfileHeader from "./components/ProfileHeader";
import ProfileTabs from "./components/ProfileTabs";

export default function TeacherProfile() {
  const { id } = useParams();
  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useGetUserByIdQuery(id, { skip: !id });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const { data: subjectsData } = useGetSubjectsQuery({ limit: 100 });
  const [fetchStudents] = useLazyGetStudentsQuery();
  const [fetchGroups] = useLazyGetGroupsQuery();

  const [openSubjectModal, setOpenSubjectModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [allSubjects, setAllSubjects] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const user = userData?.data || userData;










  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <CardBody>
            <Typography color="red">Xatolik: {error?.data?.message}</Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Using extracted components for clearer structure

  return (
    <div className="">

      <Typography variant="h3" className="text-text-primary font-bold mb-6 flex items-center gap-3">
        <User size={28} className="text-accent" /> O‘qituvchi profili
      </Typography>

      <Card className="bg-card border border-border shadow-lg rounded-2xl mb-6">
        <CardBody className="p-6">
          <ProfileHeader user={user} />
        </CardBody>
      </Card>

      <Card className="bg-card border border-border shadow-lg rounded-2xl">
        <CardBody className="p-4">
          <ProfileTabs
            user={user}
            subjects={user?.teacher_subjects || []}
          />
        </CardBody>
      </Card>


    </div>
  );
}