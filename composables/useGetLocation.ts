import { onMounted, ref } from "vue"
import { useCookies } from '@vueuse/integrations/useCookies'

export default function () {
  const { get:getCookie, set:setCookie } = useCookies(['cookie-name'])
  const locationWarnNotice = "Location access is required to use this app."
  type Position = {
    coords: {
      latitude: number;
      longitude: number;
    }
  }
  const location = ref({ lat: 0, lng: 0 })
  const locationObtained = (position:Position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    setCookie('location', { latitude, longitude })
    location.value = { lat: latitude, lng: longitude }
  }
  type PositionError = {
    code: number;
    message: string;
  }
  const errorObtainingLocation = (error:PositionError) => {
    // toast.warn(locationWarnNotice, {
    //   autoClose: 3000,
    // });
    console.warn(`Error obtaining location: ${error.message}`);
  }
  const getDevicePosition = ({
    callback, onError, bePrecise = false
  }:{
    callback?:(location: GeolocationPosition)=>void,
    onError?: (error:PositionError)=>void
    bePrecise?:boolean
  }) => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: bePrecise, // Request high accuracy
        timeout: 10000, // Maximum time (in milliseconds) allowed to retrieve the location
        maximumAge: 0 // Do not use a cached position
      };
  
      navigator.geolocation.getCurrentPosition((location)=>{
        locationObtained(location)
        callback?.(location)
      }, (error)=>{
        errorObtainingLocation(error)
        onError?.(error)
      }, options);
    } else {
      // toast.error("Geolocation is not supported by this browser.");
      console.warn("Geolocation is not supported by this browser.");
    }
  }
  
  // onMounted(()=>{
  //   if(!getCookie('location') || Object.keys(getCookie('location')).length === 0) return
  //   // getDevicePosition(true) // going behind their back to get precise location
  // })

  return {
    location,
    getDevicePosition,
    locationWarnNotice,
  }
}