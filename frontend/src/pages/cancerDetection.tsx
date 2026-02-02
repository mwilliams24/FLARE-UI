import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useAuth0 } from '@auth0/auth0-react'
import { createCaseAndRunModel } from '../api/cancerDetection'
import type { CancerType, CreateCaseRequest, CaseResult } from '../api/types'

type FormState = {
  location: string
  cancerType: CancerType | ''
  firstName: string
  lastName: string
  medicalId: string
  dob: string // YYYY-MM-DD
}

export default function CancerDetection() {
  const { getAccessTokenSilently } = useAuth0()

  const [form, setForm] = useState<FormState>({
    location: 'Houston',
    cancerType: '',
    firstName: '',
    lastName: '',
    medicalId: '',
    dob: '',
  })

  const [step, setStep] = useState<1 | 2>(1)
  const [files, setFiles] = useState<FileList | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CaseResult | null>(null)

  const canGoNext = useMemo(() => {
    return (
      form.location.trim().length > 0 &&
      form.cancerType !== '' &&
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.medicalId.trim().length > 0 &&
      form.dob.trim().length > 0
    )
  }, [form])

  const canAnalyze = useMemo(() => {
    return step === 2 && files && files.length > 0 && form.cancerType !== ''
  }, [step, files, form.cancerType])

  const handleChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const handleNext = () => {
    setError(null)
    if (!canGoNext) {
      setError('Please complete all required fields.')
      return
    }
    setStep(2)
  }

  const handleAnalyze = async () => {
    setError(null)
    setResult(null)

    if (!canAnalyze) {
      setError('Please upload at least one image to analyze.')
      return
    }

    try {
      setLoading(true)
      const token = await getAccessTokenSilently()

      const payload: CreateCaseRequest = {
        location: form.location,
        cancerType: form.cancerType as CancerType,
        patient: {
          firstName: form.firstName,
          lastName: form.lastName,
          medicalId: form.medicalId,
          dob: form.dob,
        },
      }

      // Convert FileList -> File[]
      const fileArray = Array.from(files ?? [])

      const res = await createCaseAndRunModel(token, payload, fileArray)
      setResult(res)
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong while running the scan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' },
        gap: { xs: 5, lg: 10 },
        px: { xs: 3, md: 8 },
        pt: 14, // space below fixed header
        pb: 8,
        background:
          'radial-gradient(circle at bottom right, #1b2335 0%, #0b0f19 60%)',
      }}
    >
      {/* LEFT PANEL (big vertical text like screenshot) */}
      <Box
        sx={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          p: { xs: 4, md: 6 },
          display: 'flex',
          alignItems: 'center',
          minHeight: { lg: 520 },
          background:
            'radial-gradient(circle at left center, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 60%, transparent 100%)',
        }}
      >
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: { xs: '2.2rem', md: '3rem' },
            lineHeight: 1.3,
            fontWeight: 500,
          }}
        >
          Fusion-based
          <br />
          Learning for
          <br />
          Automated
          <br />
          Radiology and
          <br />
          Epidemiology
        </Typography>
      </Box>

      {/* RIGHT PANEL (form like screenshot) */}
      <Box
        sx={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          p: { xs: 4, md: 6 },
          backgroundColor: 'rgba(0,0,0,0.25)',
        }}
      >
        <Typography sx={{ color: '#fff', fontSize: '1.2rem', mb: 3 }}>
          Cancer Detection
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* STEP 1: Patient info */}
        {step === 1 && (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <TextField
              select
              label="Location *"
              value={form.location}
              onChange={handleChange('location')}
              fullWidth
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              sx={darkFieldSx}
            >
              {/* Only option as requested */}
              <MenuItem value="Houston">Houston</MenuItem>
            </TextField>

            <TextField
              select
              label="Cancer Type"
              value={form.cancerType}
              onChange={handleChange('cancerType')}
              fullWidth
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              sx={darkFieldSx}
            >
              <MenuItem value="breast">Breast Cancer</MenuItem>
              <MenuItem value="brain">Brain Cancer</MenuItem>
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <TextField
                label="Patient First Name *"
                value={form.firstName}
                onChange={handleChange('firstName')}
                fullWidth
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                sx={darkFieldSx}
              />
              <TextField
                label="Patient Last Name *"
                value={form.lastName}
                onChange={handleChange('lastName')}
                fullWidth
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                sx={darkFieldSx}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <TextField
                label="Patient Medical # *"
                value={form.medicalId}
                onChange={handleChange('medicalId')}
                fullWidth
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                sx={darkFieldSx}
              />
              <TextField
                label="Patient DOB *"
                type="date"
                value={form.dob}
                onChange={handleChange('dob')}
                fullWidth
                InputLabelProps={{ shrink: true, sx: { color: 'rgba(255,255,255,0.7)' } }}
                sx={darkFieldSx}
              />
            </Box>

            <Button
              onClick={handleNext}
              sx={primaryButtonSx}
              fullWidth
            >
              Next
            </Button>
          </Box>
        )}

        {/* STEP 2: Upload + run model */}
        {step === 2 && (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Upload {form.cancerType === 'breast' ? 'Breast' : 'Brain'} imaging files
            </Typography>

            <Box>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(e.target.files)}
                style={{ color: 'white' }}
              />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, fontSize: '0.9rem' }}>
                Tip: You can upload multiple scans. The backend can fuse results for multi-scan cases.
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            <Button
              onClick={handleAnalyze}
              disabled={loading}
              sx={primaryButtonSx}
              fullWidth
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={18} sx={{ color: '#0b0f19' }} />
                  Analyzing...
                </Box>
              ) : (
                'Run Scan'
              )}
            </Button>

            {/* Results */}
            {result && (
              <Box
                sx={{
                  mt: 2,
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                  Result
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Classification: <b>{result.classification}</b>
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Confidence: <b>{Math.round(result.confidence * 100)}%</b>
                </Typography>

                {result.localizationImageUrl && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', mb: 1 }}>
                      Localization / Grad-CAM
                    </Typography>
                    <Box
                      component="img"
                      src={result.localizationImageUrl}
                      alt="Localization"
                      sx={{ width: '100%', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </Box>
                )}

                <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2, fontSize: '0.85rem' }}>
                  This scan + patient data is saved to the EHR database automatically.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

const darkFieldSx = {
  '& .MuiInputBase-root': {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: '10px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.18)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.28)',
  },
}

const primaryButtonSx = {
  backgroundColor: '#ff5c5c',
  color: '#0b0f19',
  fontWeight: 600,
  py: 1.4,
  borderRadius: '10px',
  textTransform: 'none',
  '&:hover': { backgroundColor: '#ff3b3b' },
}
