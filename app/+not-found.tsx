
import { View, Text, StyleSheet} from 'react-native';
import { Link, Stack } from "expo-router";


/* To view the page on the emulator i use these steps
   put a link components that goes to a non-existing page

   <Link href={"/abc"} style = {styles.gotToFeed}>
             <Text>Press Me</Text>
    </Link>

*/
export default function NotFoundPage(){
  return (
    <>
    <Stack.Screen options={{title: "Page not found", 
        headerTitleAlign: 'center'}}/>
    <View style = {styles.container}>
        <Text style = {styles.textError}> Page was not found</Text>
        <Link href="/" style={styles.goBackButton}> Go back to Home Page</Link>
    </View>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "black",
    padding: 20,
    fontSize: 22,
  },
  textError:{
    fontSize: 17,
    color: "red",
    marginBottom: 10,

  },
  goBackButton:{
    padding: 10,
    color: "white",
    borderBlockColor: "",
    backgroundColor: "rgb(46, 46, 143)",
    textAlign: 'center',
    borderRadius: 15,
    borderWidth: 2,



  }
});
