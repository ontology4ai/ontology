package com.asiainfo.modo.app.dataos.web;

import com.asiainfo.modo.app.web.ModoWebUtils;
import com.asiainfo.modo.utils.ModoConstant;
import io.github.suanchou.crypto.cipher.DesCipher;
import io.github.suanchou.utils.BeanConvertUtil;
import io.github.suanchou.utils.JsonUtil;
import lombok.Data;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

/**
 * @author QvQ
 * @date 2022/3/28
 */
public class ModoPlatWebUtils extends ModoWebUtils {

    public static final String
            MODO_PLATFORM_USER_ID_KEY = "modo_plat_user_id",
            USER_ID_KEY="modo_user_id";

    @Data
    public static class StudioCookieIdentity extends CookieIdentity {
        private String userId;
        private String platUserId;

        public boolean hasLoggedin(){
            if (ModoConstant.PLATFORM.equals(getAppName())) {
                return (platUserId!=null && platUserId.length()>0);
            }else{
                return (userId!=null && userId.length()>0);
            }
        }
    }

    public static CookieIdentity getCookieIdentity(HttpServletRequest request){
        Cookie[] cookies = request.getCookies();
        StudioCookieIdentity identity = new StudioCookieIdentity();
        if(cookies!=null){
            for (Cookie cookie : cookies) {
                if(OBFUSCATE_KEY.equals(cookie.getName())){
                    String decryptJson = DesCipher.decrypt(cookie.getValue());
                    identity = BeanConvertUtil.copyBean(JsonUtil.getInstance().read(decryptJson), StudioCookieIdentity.class);
                    break;
                }else if(USER_ID_KEY.equals(cookie.getName())) {
                    identity.setUserId(decrypt(cookie.getValue()));
                }else if(MODO_PLATFORM_USER_ID_KEY.equals(cookie.getName())) {
                    identity.setPlatUserId(decrypt(cookie.getValue()));
                }
            }
        }
        return identity;
    }

    /*public static void writeCookieIdentity(HttpServletResponse response, CookieIdentity identity){
        if(identity.hasLoggedin()){
            writeCookie(response,USER_ID_KEY,identity.getUserId());
            writeCookie(response, USER_NAME_KEY,identity.getUserName());
        }
        if(identity instanceof ModoPlatWebUtils.StudioCookieIdentity){
            StudioCookieIdentity studioIdentity = (StudioCookieIdentity) identity;
            writeCookie(response, MODO_PLATFORM_USER_ID_KEY,studioIdentity.getPlatUserId());
        }
    }*/
}
