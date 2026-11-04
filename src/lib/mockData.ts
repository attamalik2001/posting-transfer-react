export interface Employee {
  id: number
  employee_name: string
  father_name: string
  cnic: string
  address: string
  contact: string
  email: string
  date_of_birth: string
  designation: string
  parent_department: string
  cadre: string
  employment_status: string
  service_status: string
  posting_status: string
  posting_type: string
  date_of_appointment: string
  date_of_regularization: string | null
  date_of_superannuation: string
  tehsil: string
  uc: string
}

export interface UC {
  id: number
  tehsil: string
  uc_name: string
}

export interface Posting {
  id: number
  employee_id: number
  uc_id: number
}

export const INITIAL_UCS: UC[] = [
  { id: 1, tehsil: 'Jhang', uc_name: 'UC-01 City Jhang' },
  { id: 2, tehsil: 'Jhang', uc_name: 'UC-02 Civil Lines' },
  { id: 3, tehsil: 'Jhang', uc_name: 'UC-05 Kot Lakhnana' },
  { id: 4, tehsil: 'Jhang', uc_name: 'UC-61 Massan' },
  { id: 5, tehsil: 'Jhang', uc_name: 'UC-70 Mochiwala' },
  { id: 6, tehsil: 'Jhang', uc_name: 'UC-83 Shah Jeewna' },
  { id: 7, tehsil: 'Shorkot', uc_name: 'UC-12 Haveli Bahadur Shah' },
  { id: 8, tehsil: 'Shorkot', uc_name: 'UC-24 Shorkot City' },
  { id: 9, tehsil: 'Ahmedpur Sial', uc_name: 'UC-31 Garh Maharaja' },
  { id: 10, tehsil: 'Ahmedpur Sial', uc_name: 'UC-42 Ahmedpur Sial' },
  { id: 11, tehsil: '18-Hazari', uc_name: 'UC-18 Rodu Sultan' },
  { id: 12, tehsil: '18-Hazari', uc_name: 'UC-55 Athara Hazari' },
]

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 1,
    employee_name: 'Muhammad Imran',
    father_name: 'Ghulam Rasool',
    cnic: '33202-1234567-1',
    address: 'Mohallah Islam Nagar, Jhang City',
    contact: '0300-7512345',
    email: 'imran.lgcd@jhang.gov.pk',
    date_of_birth: '1978-04-12',
    designation: 'Secretary Union Council',
    parent_department: 'LG&CD',
    cadre: 'Field Administration',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2002-06-15',
    date_of_regularization: '2005-07-01',
    date_of_superannuation: '2038-04-11',
    tehsil: 'Jhang',
    uc: 'UC-01 City Jhang',
  },
  {
    id: 2,
    employee_name: 'Tariq Mehmood',
    father_name: 'Muhammad Sharif',
    cnic: '33202-2345678-3',
    address: 'Near Old Chiniot Road, Jhang',
    contact: '0301-6523489',
    email: 'tariq.mehmood@jhang.gov.pk',
    date_of_birth: '1975-09-20',
    designation: 'Senior Clerk',
    parent_department: 'District Council Jhang',
    cadre: 'Ministerial',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '1998-03-10',
    date_of_regularization: '2001-04-01',
    date_of_superannuation: '2035-09-19',
    tehsil: 'Jhang',
    uc: 'UC-02 Civil Lines',
  },
  {
    id: 3,
    employee_name: 'Abdul Sattar',
    father_name: 'Karam Dad',
    cnic: '33203-3456789-5',
    address: 'Main Bazar Haveli Bahadur Shah, Shorkot',
    contact: '0302-8934512',
    email: 'asattar.sec@shorkot.lgcd.gov.pk',
    date_of_birth: '1966-08-15',
    designation: 'Secretary Union Council',
    parent_department: 'LG&CD',
    cadre: 'Field Administration',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '1992-11-01',
    date_of_regularization: '1995-12-01',
    date_of_superannuation: '2026-08-14',
    tehsil: 'Shorkot',
    uc: 'UC-12 Haveli Bahadur Shah',
  },
  {
    id: 4,
    employee_name: 'Ghulam Abbas',
    father_name: 'Nazar Muhammad',
    cnic: '33203-4567890-7',
    address: 'Railway Road, Shorkot City',
    contact: '0303-4512398',
    email: 'ghulam.abbas@shorkot.gov.pk',
    date_of_birth: '1984-02-18',
    designation: 'Junior Clerk',
    parent_department: 'LG&CD',
    cadre: 'Ministerial',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2008-01-22',
    date_of_regularization: '2011-02-01',
    date_of_superannuation: '2044-02-17',
    tehsil: 'Shorkot',
    uc: 'UC-24 Shorkot City',
  },
  {
    id: 5,
    employee_name: 'Muhammad Aslam',
    father_name: 'Noor Muhammad',
    cnic: '33201-5678901-9',
    address: 'Garh Maharaja, Tehsil Ahmedpur Sial',
    contact: '0304-9823412',
    email: 'aslam.eng@lgcd.punjab.gov.pk',
    date_of_birth: '1980-11-05',
    designation: 'Sub-Engineer',
    parent_department: 'LG&CD',
    cadre: 'Technical',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2006-05-18',
    date_of_regularization: '2009-06-01',
    date_of_superannuation: '2040-11-04',
    tehsil: 'Ahmedpur Sial',
    uc: 'UC-31 Garh Maharaja',
  },
  {
    id: 6,
    employee_name: 'Zafar Iqbal',
    father_name: 'Hakim Ali',
    cnic: '33201-6789012-1',
    address: 'Main Chowk Ahmedpur Sial',
    contact: '0305-6712394',
    email: 'zafar.iqbal@ahmedpur.gov.pk',
    date_of_birth: '1966-10-25',
    designation: 'Secretary Union Council',
    parent_department: 'LG&CD',
    cadre: 'Field Administration',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '1991-04-15',
    date_of_regularization: '1994-05-01',
    date_of_superannuation: '2026-10-24',
    tehsil: 'Ahmedpur Sial',
    uc: 'UC-42 Ahmedpur Sial',
  },
  {
    id: 7,
    employee_name: 'Muhammad Ramzan',
    father_name: 'Fateh Sher',
    cnic: '33204-7890123-3',
    address: 'Basti Peeranwali, Athara Hazari',
    contact: '0306-3489123',
    email: 'ramzan.naib@18hazari.gov.pk',
    date_of_birth: '1982-05-14',
    designation: 'Naib Qasid',
    parent_department: 'LG&CD',
    cadre: 'Support Staff',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2004-09-01',
    date_of_regularization: '2007-10-01',
    date_of_superannuation: '2042-05-13',
    tehsil: '18-Hazari',
    uc: 'UC-55 Athara Hazari',
  },
  {
    id: 8,
    employee_name: 'Sajid Ali',
    father_name: 'Ahmad Bakhsh',
    cnic: '33204-8901234-5',
    address: 'Rodu Sultan Bazar, Tehsil 18-Hazari',
    contact: '0307-8912345',
    email: 'sajid.ali@18hazari.gov.pk',
    date_of_birth: '1979-01-30',
    designation: 'Secretary Union Council',
    parent_department: 'LG&CD',
    cadre: 'Field Administration',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2003-08-12',
    date_of_regularization: '2006-09-01',
    date_of_superannuation: '2039-01-29',
    tehsil: '18-Hazari',
    uc: 'UC-18 Rodu Sultan',
  },
  {
    id: 9,
    employee_name: 'Liaqat Ali',
    father_name: 'Sher Muhammad',
    cnic: '33202-9012345-7',
    address: 'Kot Lakhnana, Jhang Sadar',
    contact: '0308-2345671',
    email: 'liaqat.ali@mcjhang.gov.pk',
    date_of_birth: '1973-12-08',
    designation: 'Sanitary Supervisor',
    parent_department: 'Municipal Committee Jhang',
    cadre: 'Sanitation',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '1997-02-14',
    date_of_regularization: '2000-03-01',
    date_of_superannuation: '2033-12-07',
    tehsil: 'Jhang',
    uc: 'UC-05 Kot Lakhnana',
  },
  {
    id: 10,
    employee_name: 'Muhammad Nawaz',
    father_name: 'Allah Yar',
    cnic: '33202-0123456-9',
    address: 'Village Massan, Tehsil Jhang',
    contact: '0309-1234567',
    email: 'nawaz.dcjhang@punjab.gov.pk',
    date_of_birth: '1988-07-22',
    designation: 'Junior Clerk',
    parent_department: 'District Council Jhang',
    cadre: 'Ministerial',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2012-04-10',
    date_of_regularization: '2015-05-01',
    date_of_superannuation: '2048-07-21',
    tehsil: 'Jhang',
    uc: 'UC-61 Massan',
  },
  {
    id: 11,
    employee_name: 'Muhammad Akram',
    father_name: 'Peer Bakhsh',
    cnic: '33202-1122334-1',
    address: 'Mochiwala Town, Jhang',
    contact: '0310-9876543',
    email: 'akram.sec@jhang.gov.pk',
    date_of_birth: '1977-03-14',
    designation: 'Secretary Union Council',
    parent_department: 'LG&CD',
    cadre: 'Field Administration',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2001-10-05',
    date_of_regularization: '2004-11-01',
    date_of_superannuation: '2037-03-13',
    tehsil: 'Jhang',
    uc: 'UC-70 Mochiwala',
  },
  {
    id: 12,
    employee_name: 'Altaf Hussain',
    father_name: 'Ghulam Qadir',
    cnic: '33202-2233445-3',
    address: 'Shah Jeewna, District Jhang',
    contact: '0311-8765432',
    email: 'altaf.hussain@jhang.gov.pk',
    date_of_birth: '1971-06-28',
    designation: 'Senior Clerk',
    parent_department: 'LG&CD',
    cadre: 'Ministerial',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '1995-07-19',
    date_of_regularization: '1998-08-01',
    date_of_superannuation: '2031-06-27',
    tehsil: 'Jhang',
    uc: 'UC-83 Shah Jeewna',
  },
  {
    id: 13,
    employee_name: 'Bashir Ahmad',
    father_name: 'Ahmad Din',
    cnic: '33203-3344556-5',
    address: 'Old Cantonment Road, Shorkot',
    contact: '0312-7654321',
    email: 'bashir.ret@shorkot.gov.pk',
    date_of_birth: '1963-01-10',
    designation: 'Secretary Union Council',
    parent_department: 'LG&CD',
    cadre: 'Field Administration',
    employment_status: 'Retired',
    service_status: 'Retired',
    posting_status: 'Relieved',
    posting_type: 'Permanent',
    date_of_appointment: '1987-03-15',
    date_of_regularization: '1990-04-01',
    date_of_superannuation: '2023-01-09',
    tehsil: 'Shorkot',
    uc: 'UC-24 Shorkot City',
  },
  {
    id: 14,
    employee_name: 'Khalid Mahmood',
    father_name: 'Muhammad Khan',
    cnic: '33202-4455667-7',
    address: 'Satellite Town, Jhang Sadar',
    contact: '0313-6543210',
    email: 'khalid.eng@jhang.gov.pk',
    date_of_birth: '1983-11-19',
    designation: 'Sub-Engineer',
    parent_department: 'LG&CD',
    cadre: 'Technical',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '2007-09-08',
    date_of_regularization: '2010-10-01',
    date_of_superannuation: '2043-11-18',
    tehsil: 'Jhang',
    uc: 'UC-01 City Jhang',
  },
  {
    id: 15,
    employee_name: 'Muhammad Rafiq',
    father_name: 'Sultan Ahmad',
    cnic: '33204-5566778-9',
    address: 'Thal Road, Athara Hazari',
    contact: '0314-5432109',
    email: 'm.rafiq@18hazari.gov.pk',
    date_of_birth: '1966-05-12',
    designation: 'Secretary Union Council',
    parent_department: 'LG&CD',
    cadre: 'Field Administration',
    employment_status: 'Regular',
    service_status: 'Active',
    posting_status: 'Posted',
    posting_type: 'Permanent',
    date_of_appointment: '1990-08-20',
    date_of_regularization: '1993-09-01',
    date_of_superannuation: '2026-05-11',
    tehsil: '18-Hazari',
    uc: 'UC-55 Athara Hazari',
  },
]

class MockStore {
  employees: Employee[] = [...INITIAL_EMPLOYEES]
  ucs: UC[] = [...INITIAL_UCS]
  postings: Posting[] = INITIAL_EMPLOYEES.map((emp) => {
    const uc = INITIAL_UCS.find((u) => u.uc_name === emp.uc)
    return {
      id: emp.id,
      employee_id: emp.id,
      uc_id: uc ? uc.id : 1,
    }
  })

  getEmployees() {
    return this.employees
  }

  getEmployee(id: number) {
    return this.employees.find((e) => e.id === id) || null
  }

  updateEmployee(id: number, updates: Partial<Employee>) {
    const idx = this.employees.findIndex((e) => e.id === id)
    if (idx !== -1) {
      this.employees[idx] = { ...this.employees[idx], ...updates }
      return this.employees[idx]
    }
    return null
  }

  deleteEmployee(id: number) {
    this.employees = this.employees.filter((e) => e.id !== id)
    this.postings = this.postings.filter((p) => p.employee_id !== id)
  }

  getUcs() {
    return this.ucs
  }

  getPostings(employeeId?: number) {
    if (employeeId !== undefined) {
      return this.postings.filter((p) => p.employee_id === employeeId)
    }
    return this.postings
  }

  savePosting(employeeId: number, ucId: number) {
    const existing = this.postings.find((p) => p.employee_id === employeeId)
    if (existing) {
      existing.uc_id = ucId
      return existing
    }
    const newPosting: Posting = {
      id: this.postings.length > 0 ? Math.max(...this.postings.map((p) => p.id)) + 1 : 1,
      employee_id: employeeId,
      uc_id: ucId,
    }
    this.postings.push(newPosting)
    return newPosting
  }
}

export const mockStore = new MockStore()

export function setupMockSupabaseInterceptor(mockBaseUrl: string) {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

    if (!urlStr.startsWith(mockBaseUrl)) {
      return originalFetch(input, init)
    }

    const parsedUrl = new URL(urlStr)
    const pathname = parsedUrl.pathname
    const method = init?.method?.toUpperCase() || 'GET'

    // Health check
    if (pathname.includes('/auth/v1/health')) {
      return new Response(JSON.stringify({ status: 'OK' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Tables schema
    if (pathname === '/rest/v1/' || pathname === '/rest/v1') {
      return new Response(
        JSON.stringify({
          paths: {
            '/employee': { get: {} },
            '/uc': { get: {} },
            '/posting': { get: {} },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // UC endpoint
    if (pathname.includes('/rest/v1/uc')) {
      return new Response(JSON.stringify(mockStore.getUcs()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Posting endpoint
    if (pathname.includes('/rest/v1/posting')) {
      const searchParams = parsedUrl.searchParams
      const empIdParam = searchParams.get('employee_id')
      const targetEmpId = empIdParam ? parseInt(empIdParam.replace('eq.', ''), 10) : undefined

      if (method === 'GET') {
        const postings = mockStore.getPostings(targetEmpId)
        return new Response(JSON.stringify(postings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (method === 'POST') {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        mockStore.savePosting(body.employee_id, body.uc_id)
        return new Response(null, { status: 201 })
      }

      if (method === 'PATCH') {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        const idParam = searchParams.get('id')
        const postingId = idParam ? parseInt(idParam.replace('eq.', ''), 10) : undefined
        if (postingId) {
          const posting = mockStore.postings.find((p) => p.id === postingId)
          if (posting && body.uc_id) {
            posting.uc_id = body.uc_id
          }
        }
        return new Response(null, { status: 204 })
      }
    }

    // Employee endpoint
    if (pathname.includes('/rest/v1/employee')) {
      const searchParams = parsedUrl.searchParams
      const idParam = searchParams.get('id')
      const targetId = idParam ? parseInt(idParam.replace('eq.', ''), 10) : null

      if (method === 'DELETE' && targetId !== null) {
        mockStore.deleteEmployee(targetId)
        return new Response(null, { status: 204 })
      }

      if (method === 'PATCH' && targetId !== null) {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        mockStore.updateEmployee(targetId, body)
        return new Response(null, { status: 204 })
      }

      if (method === 'GET') {
        const allEmployees = mockStore.getEmployees()
        const selectParam = searchParams.get('select')

        if (targetId !== null) {
          const emp = mockStore.getEmployee(targetId)
          return new Response(JSON.stringify(emp ? [emp] : []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (selectParam === 'id') {
          return new Response(JSON.stringify(allEmployees.map((e) => ({ id: e.id }))), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Range': `0-${allEmployees.length}/${allEmployees.length}`,
            },
          })
        }

        return new Response(JSON.stringify(allEmployees), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': `0-${allEmployees.length}/${allEmployees.length}`,
          },
        })
      }
    }

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
