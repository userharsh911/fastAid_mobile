import { View, Text } from 'react-native'
import useUserBear from "../../../../store/user.store"
import useVolunteerBear from "../../../../store/volunteer.store"
import UserHome from '../../../../components/Home/userHome';
import VolunteerHome from '../../../../components/Home/volunteerHome';

export default function Index() {
  const {user} = useUserBear(state=>state);
  const {volunteer} = useVolunteerBear(state=>state);
  return (
    <>
      {
        volunteer ? <VolunteerHome/> :
        <UserHome user={user}/>
      }

      
    </>
  )
}