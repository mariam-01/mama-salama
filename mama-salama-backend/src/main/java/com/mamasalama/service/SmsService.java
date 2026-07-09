package com.mamasalama.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String fromPhone;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }

    public void sendOtp(String toPhone, String code) {
        Message.creator(
                new PhoneNumber(toPhone),
                new PhoneNumber(fromPhone),
                buildMessage(code)
        ).create();
    }

    private String buildMessage(String code) {
        return "ماما سلامة | Mama Salama\n"
             + "رمز التحقق الخاص بك: " + code + "\n"
             + "Votre code: " + code + "\n"
             + "صالح لمدة 10 دقائق / Valable 10 min";
    }
}