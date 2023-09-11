const express = require("express");
const { ClientModel } = require("../model/client");
const { DocModel } = require("../model/doctor");
const nodemailer = require("nodemailer");
require("dotenv").config()

const transporter = nodemailer.createTransport({
  port:587,
  service: "gmail",
  auth: {
    user: "chauhanrohit716@gmail.com",
    pass: process.env.gmail_api_key,
  },
});

const clientRouter = express.Router();

clientRouter.post("/details", async (req, res) => {
  const {
    client_name,
    contact,
    email,
    address,
    pet_category,
    disease_suffering,
    veterinary_appointment,
    DoctorId,
    DoctorEmail,
  } = req.body;

  try {
    const client = new ClientModel({
      client_name,
      contact,
      email,
      address,
      pet_category,
      disease_suffering,
      veterinary_appointment,
      DoctorId,
      DoctorEmail,
    });

    await client.save();

    // Send email to the client
    const appointmentDate = new Date(veterinary_appointment);
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedDay = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const clientEmailData = {
      from: "chauhanrohit716@gmail.com",
      to: email,
      subject: "Appointment Confirmation",
      text: "Thank you for booking the appointment.",
      html: `<p>Thank you for booking the appointment.</p>
             <p>Doctor's Name: ${DoctorId}</p>
             <p>Your appointment is scheduled on: ${formattedDay}, ${formattedDate}</p>`,
    };
    
    // Send email to the doctor
    const doctorEmailData = {
      from: "chauhanrohit716@gmail.com",
      to: DoctorEmail, // Use DoctorEmail as the recipient
      subject: "New Appointment",
      text: "A new appointment has been booked.",
      html: `<p>A new appointment has been booked.</p>
         <p>Client Name: ${client_name}</p>
         <p>Appointment Date: ${formattedDay}, ${formattedDate}</p>`,
    };

    transporter.sendMail(clientEmailData, (error, info) => {
      if (error) {
        console.log("Error sending client email:", error);
      } else {
        console.log("Client email sent:", info.response);
      }
    });

    transporter.sendMail(doctorEmailData, (error, info) => {
      if (error) {
        console.log("Error sending doctor email:", error);
      } else {
        console.log("Doctor email sent:", info.response);
      }
    });

    res.status(200).send({ msg: "Client registered successfully!" });
  } catch (error) {
    res.status(400).send({ msg: error.message });
    console.log(error);
  }
});





  

clientRouter.get("/", async (req, res) => {
    try {
        const user = await ClientModel.find()
        res.status(200).send({ msg: user })
    } catch (error) {
        res.status(400).send({ msg: error.message })

    }
})


// client update the appointment and sent the email 

clientRouter.patch('/update/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  const payload = req.body;

  try {
    await ClientModel.findByIdAndUpdate({ _id: clientId }, payload);

    // Fetch the updated client data
    const updatedClient = await ClientModel.findById(clientId);

    // Send email to the client
    const clientEmailData = {
      from: 'chauhanrohit716@gmail.com',
      to: updatedClient.email,
      subject: 'Appointment Update',
      text: 'Your appointment has been updated.',
      html: `<p>Your appointment details have been updated.</p>
              <p>New appointment date: ${updatedClient.veterinary_appointment}</p>`,
    };

    await transporter.sendMail(clientEmailData);
    console.log('Client email sent');

    // Send email to the doctor
    const doctorEmailData = {
      from: 'chauhanrohit716@gmail.com',
      to: updatedClient.DoctorEmail,
      subject: 'Appointment Update',
      text: 'An appointment details have been updated.',
      html: `<p>An appointment details have been updated.</p>
         <p>Client Name: ${updatedClient.client_name}</p>
         <p>Updated Appointment Date: ${updatedClient.veterinary_appointment}</p>`,
    };

    await transporter.sendMail(doctorEmailData);
    console.log('Doctor email sent');

    res.status(200).send({ msg: 'Client updated successfully!' });
  } catch (error) {
    console.log('Error:', error);
    res.status(400).send({ msg: error.message });
  }
});


// client delete the appointment 

clientRouter.delete('/delete/:clientId', async (req, res) => {
  const clientId = req.params.clientId;

  try {
    // Fetch the client data before deleting the appointment
    const clientToDelete = await ClientModel.findById(clientId);

    // Delete the appointment
    await ClientModel.findByIdAndUpdate({ _id: clientId }, { $unset: { veterinary_appointment: 1 } });

    // Send email to the client
    const clientEmailData = {
      from: 'chauhanrohit716@gmail.com',
      to: clientToDelete.email,
      subject: 'Appointment Cancellation',
      text: 'Your appointment has been canceled.',
      html: '<p>Your appointment has been canceled.</p>',
    };

    await transporter.sendMail(clientEmailData);
    console.log('Client email sent for appointment cancellation');

    // Send email to the doctor
    const doctorEmailData = {
      from: 'chauhanrohit716@gmail.com',
      to: clientToDelete.DoctorEmail,
      subject: 'Appointment Cancellation',
      text: 'An appointment has been canceled.',
      html: `<p>An appointment has been canceled.</p>
         <p>Client Name: ${clientToDelete.client_name}</p>`,
    };

    await transporter.sendMail(doctorEmailData);
    console.log('Doctor email sent for appointment cancellation');

    res.status(200).send({ msg: 'Appointment canceled successfully!' });
  } catch (error) {
    console.log('Error:', error);
    res.status(400).send({ msg: error.message });
  }
});




module.exports = {
    clientRouter
};
