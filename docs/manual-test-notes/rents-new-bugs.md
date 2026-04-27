bugs on rents/new page:
- field klien not show dropdown when clicked/active, needs to type something first
- when type non existing client, cant create new client after click "Buat klien baru: "test01""
- on daftar kostum field, doesnt show drop down when clicked/active, needs to type something first
- on daftar kostum field, when choosing first item it did show that item below the field, but i cant add another item after that
- i cant submit the form after filling all the required field
got this error on api http://localhost/api/rents

request payload: {"guarantee_type":"KTP","guarantee_number":"3175072511980008","rent_start":"2026-04-01","rent_end":"2026-04-30","notes":"test isi form","items":[{"quantity":1}],"client_name":"test01"}

response: {"error":"costume not found: 0"}