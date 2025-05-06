package io.openvidu.openvidu_android.utils;

import android.text.Editable;
import android.util.Base64;

import java.util.Random;

/**
 * Contains static methods
 */
public class OpenViduUtils {

    /**
     *
     * @param secret
     * @return
     */
    public static String getBasicAuthString(String secret){
        String encodedSecretString = android.util.Base64.encodeToString(("OPENVIDUAPP:" + secret).getBytes(), Base64.DEFAULT);
        return String.format("Basic %s", encodedSecretString.trim());
    }
}
