import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../../services/api';
import Button from '../../../components/common/Button';
import { InterviewersList } from '../components/InterviewScheduler/InterviewersList';
import { CandidatesList } from '../components/InterviewScheduler/CandidatesList';
import { ScheduleParametersModal } from '../components/InterviewScheduler/ScheduleParametersModal';
import { ConfirmationModal } from '../components/InterviewScheduler/ConfirmationModal';
import { EditableSchedule } from '../components/InterviewScheduler/EditableSchedule';
import { GeneratedSchedule } from '../components/InterviewScheduler/GeneratedSchedule';
import { generateInterviewSchedule } from '../components/InterviewScheduler/scheduleGenerator';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { sendInterviewScheduledEmail } from '../../../services/emailService';
import { 
  toggleInterviewer, 
  handleScheduleEdit, 
  formatScheduleForAPI, 
  formatEmailData 
} from '../../../utils/InterviewSchedularUtils';
import { toast } from 'react-hot-toast';
import architectsLogo from '../../../assets/architectsLogo.png';
import { useNavigate } from 'react-router-dom';

const InterviewScheduler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [interviewers, setInterviewers] = useState([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [scheduleParams, setScheduleParams] = useState({
    startDate: '',
    endDate: '',
    dailyStartTime: '10:00',
    dailyEndTime: '17:00',
    interviewDuration: 45,
    skipWeekends: true,
    includeLunchBreak: true,
    lunchStartTime: '13:00',
    lunchEndTime: '14:00'
  });
  const [generatedSchedule, setGeneratedSchedule] = useState([]);
  const [editableSchedule, setEditableSchedule] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedApplications = location.state?.selectedApplications || [];
  const jobPostingId = location.state?.jobPostingId || 1;

  useEffect(() => {
    const fetchInterviewers = async () => {
      try {
        const response = await api.get('/auth/interviewers');
        const fetchedInterviewers = response.data.interviewers;
        setInterviewers(fetchedInterviewers);
        
        // Initialize all interviewers as unselected
        const initialSelected = fetchedInterviewers.reduce((acc, interviewer) => {
          acc[interviewer.id] = false; // Changed from true to false
          return acc;
        }, {});
        setSelectedInterviewers(initialSelected);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch interviewers');
        setLoading(false);
      }
    };
    fetchInterviewers();
  }, []);

  const handleInterviewerToggle = (interviewerId) => {
    setSelectedInterviewers(prev => toggleInterviewer(prev, interviewerId));
  };

  const handleScheduleGeneration = async () => {
    console.log("generate shedule clicked ")
    setIsGenerating(true);
    try {
      const selectedInterviewerIds = Object.keys(selectedInterviewers)
        .filter(id => selectedInterviewers[id]);

        console.log("selectedInterviewerIds", selectedInterviewerIds)

      if (!selectedInterviewerIds.length) {
        alert('Please select at least one interviewer');
        return;
      }
      
      const schedule = await generateInterviewSchedule(
        selectedInterviewerIds,
        selectedApplications,
        scheduleParams
      );

      setGeneratedSchedule(schedule);
      setEditableSchedule(schedule);
      setShowModal(false);
    } catch (error) {
      console.error("Schedule generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleEditWrapper = (dayIndex, interviewIndex, updatedInterview) => {
    const newSchedule = handleScheduleEdit(
      editableSchedule, 
      dayIndex, 
      interviewIndex, 
      updatedInterview, 
      scheduleParams.interviewDuration
    );
    setEditableSchedule(newSchedule);
  };

  const handleConfirmSchedule = async (sendEmail) => {
    try {
      setConfirmLoading(true);
      const schedules = formatScheduleForAPI(editableSchedule, jobPostingId);
      console.log('Sending schedules:', schedules); // Debug log

      const response = await api.post('/interviews/schedule', { schedules });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to schedule interviews');
      }

      if (sendEmail && response.data.schedules?.length > 0) {
        const emailDataArray = formatEmailData(response.data.schedules);
        console.log('Email data array:', emailDataArray); // Debug log

        if (emailDataArray.length === 0) {
          throw new Error('No valid email data generated');
        }

        const emailResult = await sendInterviewScheduledEmail(emailDataArray);
        console.log('Email send result:', emailResult); // Debug log

        if (emailResult.success) {
          toast.success('Interviews scheduled and emails sent successfully');
        } else {
          toast.warning('Interviews scheduled but some emails failed to send');
        }
      } else {
        toast.success('Interviews scheduled successfully');
      }
    } catch (error) {
      console.error('Error in handleConfirmSchedule:', error);
      toast.error(error.message || 'Failed to schedule interviews');
    } finally {
      setConfirmLoading(false);
      setShowConfirmation(false);
    }
  };

  if (loading) return <Loading size="lg" text="Please wait..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 mb-5 z-50 rounded-lg mx-auto">
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
            <h1 className="text-2xl font-bold">Schedule Interviews</h1>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <InterviewersList 
          interviewers={interviewers}
          selectedInterviewers={selectedInterviewers}
          toggleInterviewer={handleInterviewerToggle}
        />
        <CandidatesList selectedApplications={selectedApplications} />
      </div>

      <Button
        onClick={() => setShowModal(true)}
        variant="primary"
        className="mt-6"
      >
        Generate Schedule
      </Button>

      {showModal && (
        <ScheduleParametersModal
          scheduleParams={scheduleParams}
          setScheduleParams={setScheduleParams}
          onClose={() => setShowModal(false)}
          onGenerate={handleScheduleGeneration}
          isGenerating={isGenerating}
        />
      )}

      {editableSchedule && editableSchedule.length > 0 && (
        <EditableSchedule
          editableSchedule={editableSchedule}
          interviewers={interviewers}
          handleScheduleEdit={handleScheduleEditWrapper}
          onConfirm={() => setShowConfirmation(true)}
        />
      )}

      {showConfirmation && (
        <ConfirmationModal
          onConfirm={handleConfirmSchedule}
          onCancel={() => setShowConfirmation(false)}
          confirmLoading={confirmLoading}
        />
      )}

      {generatedSchedule && generatedSchedule.length > 0 && (
        <GeneratedSchedule 
          schedule={generatedSchedule} 
        />
      )}
    </div>
  );
};

export default InterviewScheduler;