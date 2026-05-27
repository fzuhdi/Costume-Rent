# Lookup

- Lookup requires reference plus phone and uses safe not-found copy.
- Forgot-code recovery never reveals booking existence; it creates a staff notification.
- Change requests do not mutate rental details. They create a staff-facing notification with reference, customer, change type, and notes.
- Recovery and change forms need loading, success, and error states.
