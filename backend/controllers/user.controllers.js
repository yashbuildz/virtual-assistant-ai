import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import moment from "moment"
import { exec } from "child_process"

export const getCurrentUser = async (req, res) => {
  try {

    const userId = req.userId

    const user = await User.findById(userId).select("-password")

    if (!user) {
      return res.status(400).json({
        message: "user not found"
      })
    }

    return res.status(200).json(user)

  } catch (error) {

    return res.status(400).json({
      message: "get current user error"
    })
  }
}

export const updateAssistant = async (req, res) => {

  try {

    const { assistantName, imageUrl } = req.body

    let assistantImage

    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path)
    }
    else {
      assistantImage = imageUrl
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        assistantName,
        assistantImage
      },
      {
        new: true
      }
    ).select("-password")

    return res.status(200).json(user)

  } catch (error) {

    return res.status(400).json({
      message: "updateAssistantError user error"
    })
  }
}

export const askToAssistant = async (req, res) => {

  try {

    const { command } = req.body

    const user = await User.findById(req.userId)

    user.history.push(command)

    await user.save()

    const userName = user.name
    const assistantName = user.assistantName

    const gemResult = await geminiResponse(
      command,
      assistantName,
      userName
    )

    if (!gemResult) {

      return res.status(400).json({
        response: "Sorry, I can't understand"
      })
    }

    console.log(gemResult)

    const type = gemResult.type

    switch (type) {

      // DATE TIME

      case "get-date":

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current date is ${moment().format("YYYY-MM-DD")}`
        })

      case "get-time":

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current time is ${moment().format("hh:mm A")}`
        })

      case "get-day":

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Today is ${moment().format("dddd")}`
        })

      case "get-month":

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current month is ${moment().format("MMMM")}`
        })

      // OPEN APPS

      case "open-vscode":

        exec("code")

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: "Opening VS Code"
        })

      case "close-vscode":

        exec("taskkill /IM Code.exe /F")

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: "Closing VS Code"
        })

      case "open-chrome":

        exec("start chrome")

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: "Opening Chrome"
        })

      case "close-chrome":

        exec("taskkill /IM chrome.exe /F")

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: "Closing Chrome"
        })

      // SYSTEM COMMANDS

      case "shutdown-pc":

        exec("shutdown /s /t 5")

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: "Shutting down PC"
        })

      case "restart-pc":

        exec("shutdown /r /t 5")

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: "Restarting PC"
        })

      // WEB COMMANDS

      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
      case "open-google":
      case "close-tab":
      case "open-first-link":
      case "general":

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: gemResult.response
        })

      default:

        return res.status(400).json({
          response: "I didn't understand that command."
        })
    }

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      response: "ask assistant error"
    })
  }
}