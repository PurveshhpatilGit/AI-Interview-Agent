import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createSession,
  getSessions,
  reset,
  deleteSession,
} from "../features/sessions/sessionSlice";
import { toast } from "react-toastify";
import SessionCard from "../components/SessionCard";

const ROLES = [
  "MERN Stack Developer",
  "MEAN Stack Developer",
  "Full Stack Python",
  "Full Stack Java",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer (AWS/Azure/GCP)",
  "Cybersecurity Engineer",
  "Blockchain Developer",
  "Mobile Developer (iOS/Android)",
  "Game Developer",
  "UI/UX Designer",
  "QA Automation Engineer",
  "Product Manager",
];

const LEVELS = ["Junior", "Mid-Level", "Senior"];
const TYPES = [
  { label: "Oral only", value: "oral-only" },
  { label: "Coding Mix", value: "coding-mix" },
];
const COUNTS = [5, 10, 15];

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { sessions, isLoading, isGenerating, isError, message } = useSelector(
    (state) => state.sessions,
  );

  const isProcessing = isGenerating;

  // ✅ SAFE USER HANDLING
  const displayName = user?.name || "User";
  const firstName = displayName.split(" ")[0];

  const [formData, setFormData] = useState({
    role: user?.preferredRole || ROLES[0],
    level: LEVELS[0],
    interviewType: TYPES[1].value,
    count: COUNTS[0],
  });

  useEffect(() => {
    dispatch(getSessions());
  }, [dispatch]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(createSession(formData));
  };

  const viewSession = (session) => {
    if (session.status === "completed") {
      navigate(`/review/${session._id}`);
    } else if (session.status === "in-progress") {
      navigate(`/interview/${session._id}`);
    } else {
      toast.info("Session not ready yet");
    }
  };

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this session?")) {
      dispatch(deleteSession(sessionId));
      toast.error("Session Deleted");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12 animate-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 sm:pb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Welcome, <span className="text-teal-600">{firstName}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-lg font-medium">
            Ready for your technical prep?
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-teal-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-teal-100 flex sm:block items-center gap-2">
            <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">
              Total Sessions
            </p>
            <p className="text-xl sm:text-2xl font-black text-teal-700 leading-none">
              {sessions?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 sm:px-8 sm:py-6">
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="bg-teal-500 w-1.5 h-5 rounded-full mr-3"></span>
            New Interview
          </h2>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 items-end"
        >
          {/* ROLE */}
          <div>
            <label className="text-xs font-bold text-slate-400">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={onChange}
              className="w-full p-3 bg-slate-50 rounded-xl"
            >
              {ROLES.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* LEVEL */}
          <div>
            <label className="text-xs font-bold text-slate-400">Level</label>
            <select
              name="level"
              value={formData.level}
              onChange={onChange}
              className="w-full p-3 bg-slate-50 rounded-xl"
            >
              {LEVELS.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* COUNT */}
          <div>
            <label className="text-xs font-bold text-slate-400">Length</label>
            <select
              name="count"
              value={formData.count}
              onChange={onChange}
              className="w-full p-3 bg-slate-50 rounded-xl"
            >
              {COUNTS.map((count) => (
                <option key={count}>{count} Qs</option>
              ))}
            </select>
          </div>

          {/* TYPE */}
          <div>
            <label className="text-xs font-bold text-slate-400">Type</label>
            <select
              name="interviewType"
              value={formData.interviewType}
              onChange={onChange}
              className="w-full p-3 bg-slate-50 rounded-xl"
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isProcessing}
            className="bg-teal-600 text-white p-3 rounded-xl"
          >
            {isProcessing ? "Generating..." : "Start Interview"}
          </button>
        </form>
      </div>

      {/* HISTORY */}
      <div>
        <h2 className="text-xl font-bold mb-4">Interview History</h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : sessions?.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              onClick={viewSession}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
