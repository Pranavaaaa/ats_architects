import React, { useState, useEffect } from "react";
import {
  useParams,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { hasPermission } from "../../../utils/permissions";
import api from "../../../services/api";
import Button from "../../../components/common/Button";
import ResumeViewer from "../../../components/common/ResumeViewer";
import Loading from "../../../components/common/Loading";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { CalendarIcon } from '@heroicons/react/solid';
import DashboardHeader from "../components/Dashboard/DashboardHeader";
import { getInitialPermissions, updatePermissions } from "../../../utils/dashboardUtils";
import architectsLogo from '../../../assets/architectsLogo.png';
// import { handleLogout } from "../../../utils/logoutUtils";

const ApplicationsPage = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const jobTitle = location.state?.jobTitle;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: {
      start: "",
      end: "",
    },
    minScore: "0",
    maxScore: "100",
    limit: "",
  });
  const [permissions, setPermissions] = useState(getInitialPermissions());
  

  // Add state for select all
  const [selectAll, setSelectAll] = useState(false);

  const canViewApplications = hasPermission(user?.role, "view_applications");
  const canScheduleInterviews = hasPermission(user?.role, "schedule_interview");

  useEffect(() => {
    let isMounted = true;

    if (user) {
      setPermissions(updatePermissions(user, hasPermission));
    }

    const fetchApplications = async () => {
      if (!canViewApplications) {
        setError("Unauthorized to view applications");
        setLoading(false);
        return;
      }
      // return;

      try {
        setLoading(true);
        const response = await api.get(`/applications/${jobId}`);
        if (isMounted) {
          setApplications(response.data.applications);
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error.response?.data?.message || "Failed to fetch applications"
          );
          setApplications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
    };
  }, [jobId, canViewApplications, user]);

  const toggleCandidateSelection = (applicationId) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [applicationId]: !prev[applicationId],
    }));
  };

  // Add toggle function for select all
  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    const newSelectedState = {};
    filteredApplications.forEach((app) => {
      newSelectedState[app.applicationId] = !selectAll;
    });
    setSelectedCandidates(newSelectedState);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [name]: value,
      },
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const applyFilters = (applications) => {
    return applications
      .filter((app) => {
        const date = new Date(app.applicationDate);
        const score = parseFloat(app.resumeScore);

        // Date range filter
        if (filters.dateRange.start && date < new Date(filters.dateRange.start))
          return false;
        if (filters.dateRange.end && date > new Date(filters.dateRange.end))
          return false;

        // Score range filter
        if (filters.minScore && score < parseFloat(filters.minScore))
          return false;
        if (filters.maxScore && score > parseFloat(filters.maxScore))
          return false;

        return true;
      })
      .slice(0, filters.limit ? parseInt(filters.limit) : undefined);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: {
        start: "",
        end: "",
      },
      minScore: "",
      maxScore: "",
      limit: "",
    });
  };

  const filteredApplications = applyFilters(applications);

  const selectedCount =
    Object.values(selectedCandidates).filter(Boolean).length;

  const handleScheduleInterviews = () => {
    const selectedIds = Object.keys(selectedCandidates).filter(
      (id) => selectedCandidates[id]
    );

    navigate("/recruiter/interview-schedular", {
      state: { selectedApplications: selectedIds, jobPostingId: jobId },
    });
  };

  // Add this status styling function at the top of your component
  const getStatusStyle = (status) => {
    const baseStyle = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'PENDING':
        return `${baseStyle} bg-yellow-100 text-yellow-800`;
      case 'ACCEPTED':
        return `${baseStyle} bg-green-100 text-green-800`;
      case 'REJECTED':
        return `${baseStyle} bg-red-100 text-red-800`;
      case 'SCHEDULED':
        return `${baseStyle} bg-blue-100 text-blue-800`;
      default:
        return `${baseStyle} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) return <Loading size="lg" text="Loading Applications..." />;

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!canViewApplications) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <img
              src={architectsLogo}
              alt="ATS Architects Logo"
              className="h-12 w-12 rounded-full object-cover"
            />
            <h1 className="text-2xl font-bold">Applications for <span className="font-bold"> {jobTitle} </span></h1>
          </div>
          <div className="flex items-center gap-4">
            {canScheduleInterviews && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleScheduleInterviews}
                  variant="primary"
                  size="md"
                  disabled={selectedCount === 0}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-white" />
                      <span>Schedule Interviews</span>
                    </div>
                    <span className="text-xs font-thin text-white mt-1">
                      Selected: {selectedCount} candidates
                    </span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">

      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 mb-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <input
              type="date"
              name="start"
              value={filters.dateRange.start}
              onChange={handleDateRangeChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="date"
              name="end"
              value={filters.dateRange.end}
              onChange={handleDateRangeChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Resume Score Range
            </label>
            <input
              type="number"
              name="minScore"
              placeholder="Min Score"
              value={filters.minScore}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="number"
              name="maxScore"
              placeholder="Max Score"
              value={filters.maxScore}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Limit Results
            </label>
            <input
              type="number"
              name="limit"
              placeholder="Number of results"
              value={filters.limit}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              onClick={resetFilters}
              variant="secondary"
              size="sm"
              className="w-full mt-2"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Select All</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Candidate Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Application Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Application Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Resume Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Resume
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application, index) => (
                <tr key={application.applicationId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCandidates[application.applicationId] || false}
                      onChange={() => toggleCandidateSelection(application.applicationId)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    /> 
                    <span className="ml-2 text-sm text-gray-500">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {application.candidateName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {application.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(
                        application.applicationDate
                      ).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <span className={getStatusStyle(application.applicationStatus)}>
                        {application.applicationStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {application.resumeScore}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ResumeViewer resume={application.resume} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;
