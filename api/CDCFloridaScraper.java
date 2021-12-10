package com;

import org.json.JSONObject;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

public class Main {

    static String[] _MONTHS = new String[] {
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December" };

    public static void main(String[] args) throws IOException {

        /*
            Download the cdc data file from https://data.cdc.gov/Case-Surveillance/United-States-COVID-19-Cases-and-Deaths-by-State-o/9mfq-cb36
                Export -> CSV
            filepath should point to this downloaded file
        */
        String filepath = "...\\...\\{higher_dir}\\US_Covid_By_State.csv";

        File file = new File(filepath);
        BufferedReader br = new BufferedReader(new FileReader(file));
        String line;
        int i = 0;
        HashMap<String, JSONObject> files = new HashMap<String, JSONObject>();
        while ((line = br.readLine()) != null) {
//            System.out.println(line);
            String[] raw = line.split(",");
            if(i == 0) {
                i++;
                continue;
            }
            if (!raw[1].equals("FL")) continue;

            String date = raw[0];
            String[] dateparts = date.split("/");
            String year = dateparts[2];
            String month = _MONTHS[Integer.parseInt(dateparts[0])-1];
            String day = dateparts[1];
            int cases = parseInt(raw[5]);
            // CDC has a probable_cases value
            int probCases = parseInt(raw[6]);

            String key = month+year;
            if(!files.containsKey(key)) {
                files.put(key, new JSONObject());
            }
            JSONObject monthdata = files.get(key);
            JSONObject daydata = new JSONObject();
            daydata.put("reported", cases);
//            daydata.put("probable", probCases);
            monthdata.put(Integer.toString(parseInt(day)), daydata);
//            System.out.println(i + " : " + key +" : "+day+" : "+ cases+":"+probCases);

            i++;
        }

        for (Map.Entry<String,JSONObject> entry : files.entrySet()) {

            /***********************************************
             Uncomment this line and run to save the data */
            //download(entry.getKey(), entry.getValue());


//            System.out.println(entry.getKey());
//            System.out.println(entry.getValue().toString(4));
//            System.out.println();
        }
        // print data out to check before creating files
        System.out.println(files.size());
        System.out.println(files.get("August2021"));
    }

    private static void download(String key, JSONObject data) throws IOException {
        new File("./Florida/").mkdirs();
        BufferedWriter br = new BufferedWriter(new FileWriter(new File("./Florida/"+key+".txt")));
        br.write(data.toString(3));
        br.close();
    }

    static int parseInt(String s) {
        try {
            return Integer.parseInt(s);
        } catch(Exception e) {
            return 0;
        }
    }
}
