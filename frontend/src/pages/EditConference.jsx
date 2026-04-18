import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { conferencesAPI } from '../api'
import { Edit, Calendar, MapPin, Tag, FileText, AlertCircle, Save, Trash2, Eye } from 'lucide-react'

function formatDateTimeForInput(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EditConference() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conference, setConference] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    category: '',
    cfp_deadline: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConference()
  }, [id])

  const loadConference = async () => {
    try {
      setLoading(true)
      const response = await conferencesAPI.getConference(id)
      const conf = response.data
      setConference(conf)
      setFormData({
        title: conf.title,
        description: conf.description || '',
        start_date: formatDateTimeForInput(conf.start_date),
        end_date: formatDateTimeForInput(conf.end_date),
        location: conf.location || '',
        category: conf.category || '',
        cfp_deadline: formatDateTimeForInput(conf.cfp_deadline),
      })
    } catch (err) {
      setError('Conference not found')
    } finally {
      setLoading(false)
    }
  }

  const canEdit = user && conference && (user.id === conference.user_id || user.role === 'admin')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    const cfpDeadline = formData.cfp_deadline ? new Date(formData.cfp_deadline) : null

    if (endDate <= startDate) {
      return 'End date must be after start date'
    }

    if (cfpDeadline && cfpDeadline >= startDate) {
      return 'CFP deadline must be before start date'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canEdit) return

    setError('')
    setSaving(true)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setSaving(false)
      return
    }

    try {
      const conferenceData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        cfp_deadline: formData.cfp_deadline ? new Date(formData.cfp_deadline).toISOString() : null,
      }

      await conferencesAPI.updateConference(id, conferenceData)
      await loadConference() // Reload to get updated data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update conference')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit) return

    if (!window.confirm('Are you sure you want to delete this conference? This action cannot be undone.')) {
      return
    }

    try {
      await conferencesAPI.deleteConference(id)
      navigate('/')
    } catch (err) {
      alert('Failed to delete conference')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!conference) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Conference not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            {canEdit ? <Edit className="h-6 w-6 text-primary-600" /> : <Eye className="h-6 w-6 text-primary-600" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {canEdit ? 'Edit Conference' : 'View Conference'}
            </h1>
            <p className="text-gray-600">
              {canEdit ? 'Update the conference details' : 'Conference details (read-only)'}
            </p>
          </div>
        </div>

        {!canEdit && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              You can only view this conference. Only the owner or an admin can edit it.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Conference Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              disabled={!canEdit}
              value={formData.title}
              onChange={handleChange}
              className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter conference title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              disabled={!canEdit}
              value={formData.description}
              onChange={handleChange}
              className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Provide a detailed description of the conference"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="start_date"
                name="start_date"
                required
                disabled={!canEdit}
                value={formData.start_date}
                onChange={handleChange}
                className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                id="end_date"
                name="end_date"
                required
                disabled={!canEdit}
                value={formData.end_date}
                onChange={handleChange}
                className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              disabled={!canEdit}
              value={formData.location}
              onChange={handleChange}
              className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="City, Country or Virtual"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="inline h-4 w-4 mr-1" />
              Category
            </label>
            <input
              type="text"
              id="category"
              name="category"
              disabled={!canEdit}
              value={formData.category}
              onChange={handleChange}
              className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., Computer Science, Medicine, Engineering"
            />
          </div>

          {/* CFP Deadline */}
          <div>
            <label htmlFor="cfp_deadline" className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline h-4 w-4 mr-1" />
              CFP Deadline
            </label>
            <input
              type="datetime-local"
              id="cfp_deadline"
              name="cfp_deadline"
              disabled={!canEdit}
              value={formData.cfp_deadline}
              onChange={handleChange}
              className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Deadline for paper submissions
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary w-full"
          >
            Back to Conferences
          </button>
        </form>
      </div>
    </div>
  )
}
