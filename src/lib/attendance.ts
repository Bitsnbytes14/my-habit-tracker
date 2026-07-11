export interface AttendanceClass {
  id: string;
  day: string;
  time: string;
  type: string;
  room?: string;
}

export interface SubjectConfig {
  name: string;
  classes: AttendanceClass[];
}

export const attendanceConfig: SubjectConfig[] = [
  {
    name: 'Compiler Construction',
    classes: [
      { id: 'cc_mon_theory', day: 'Monday', time: '10:50–11:45', type: 'Theory', room: 'USJ-404' },
      { id: 'cc_wed_theory', day: 'Wednesday', time: '10:50–11:45', type: 'Theory', room: 'USJ-403' },
      { id: 'cc_thu_theory', day: 'Thursday', time: '9:55–10:50', type: 'Theory', room: 'USJ-404' },
      { id: 'cc_thu_lab', day: 'Thursday', time: '1:35–2:30', type: 'Lab', room: 'VTI-C07' },
    ],
  },
  {
    name: 'DevOps Theory',
    classes: [
      { id: 'devops_theory_tue', day: 'Tuesday', time: '3:25–4:20', type: 'Theory', room: 'ARD-402' },
      { id: 'devops_theory_thu', day: 'Thursday', time: '10:50–11:45', type: 'Theory', room: 'ARD-402' },
    ],
  },
  {
    name: 'DevOps Lab',
    classes: [
      { id: 'devops_lab_tue', day: 'Tuesday', time: '9:00–10:50', type: 'Lab', room: 'ADS-C07' },
      { id: 'devops_lab_wed', day: 'Wednesday', time: '12:40–2:30', type: 'Lab', room: 'ADS-C09' },
    ],
  },
  {
    name: 'Data Science Theory',
    classes: [
      { id: 'ds_theory_mon', day: 'Monday', time: '2:30–3:25', type: 'Theory', room: 'DSD-404' },
      { id: 'ds_theory_tue', day: 'Tuesday', time: '2:30–3:25', type: 'Theory', room: 'DSD-404' },
      { id: 'ds_theory_wed', day: 'Wednesday', time: '9:55–10:50', type: 'Theory', room: 'DSD-404' },
    ],
  },
  {
    name: 'Data Science Lab',
    classes: [
      { id: 'ds_lab_tue', day: 'Tuesday', time: '12:40–2:30', type: 'Lab', room: 'DPD-C04' },
    ],
  },
  {
    name: 'HCI',
    classes: [
      { id: 'hci_tue_theory', day: 'Tuesday', time: '10:50–11:45', type: 'Theory', room: 'SUG-402' },
      { id: 'hci_wed_theory', day: 'Wednesday', time: '9:00–9:55', type: 'Theory', room: 'SUG-404' },
      { id: 'hci_thu_theory', day: 'Thursday', time: '9:00–9:55', type: 'Theory', room: 'SUG-401' },
    ],
  },
  {
    name: 'Cybersecurity',
    classes: [
      { id: 'cyber_mon_theory', day: 'Monday', time: '3:25–4:20', type: 'Theory', room: 'PAB-402' },
      { id: 'cyber_fri_theory', day: 'Friday', time: '9:55–10:50', type: 'Theory', room: 'PAB-403' },
    ],
  },
  {
    name: 'Flexi',
    classes: [
      { id: 'flexi_thu', day: 'Thursday', time: '12:40–1:35', type: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
      { id: 'flexi_fri_230', day: 'Friday', time: '2:30–3:25', type: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
      { id: 'flexi_fri_325', day: 'Friday', time: '3:25–4:20', type: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
    ],
  },
];
