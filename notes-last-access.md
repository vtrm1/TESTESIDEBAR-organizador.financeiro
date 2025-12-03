# Last access tracking notes

- The access manager shows last access using `entry.lastLoginAt` formatted in `createAccessManagerListItem`. This reads the profile documents rendered for pending/approved/blocked entries.
- The profile sync routine (`syncUserProfile`) sets `lastLoginAt` and `updatedAt` to `firebase.firestore.Timestamp.now()` every time a user session is processed in `handleUserSignedIn`, ensuring each new app start records a timestamp.
- Because the timestamp is written only for the currently authenticated user, other users' last access values update the next time they load or refresh the app; there is no background polling of other profiles.
- Reads in the access manager use three filtered queries on the `profiles` collection (status pending/approved/blocked), so showing the last access data does not add extra reads beyond these existing queries.
