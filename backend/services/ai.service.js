import { GoogleGenerativeAI } from "@google/generative-ai"


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
    },
    systemInstruction: `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
    
    Examples: 

    <example>
 
    response: {

    "text": "this is you fileTree structure of the express server",
    "fileTree": {
        "app.js": {
            file: {
                contents: "
                const express = require('express');

                const app = express();


                app.get('/', (req, res) => {
                    res.send('Hello World!');
                });


                app.listen(3000, () => {
                    console.log('Server is running on port 3000');
                })
                "
            
        },
    },

        "package.json": {
            file: {
                contents: "

                {
                    "name": "temp-server",
                    "version": "1.0.0",
                    "main": "index.js",
                    "scripts": {
                        "test": "echo \"Error: no test specified\" && exit 1"
                    },
                    "keywords": [],
                    "author": "",
                    "license": "ISC",
                    "description": "",
                    "dependencies": {
                        "express": "^4.21.2"
                    }
}

                
                "
                
                

            },

        },

    },
    "buildCommand": {
        mainItem: "npm",
            commands: [ "install" ]
    },

    "startCommand": {
        mainItem: "node",
            commands: [ "app.js" ]
    }
}

    user:Create an express application 
   
    </example>


    
       <example>

       user:Hello 
       response:{
       "text":"Hello, How can I help you today?"
       }
       
       </example>
    
 IMPORTANT RESTRICTION: NEVER EVER use file names with paths like 'routes/index.js', 'controllers/user.js', etc. 
Instead, ALWAYS use simple file names like 'app.js', 'server.js', 'package.json'. 
This is a CRITICAL requirement for the application to function correctly.
       
       
    `
});

export const generateResult = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        
        // Try to identify JSON in the response
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        
        // If we found valid JSON delimiters, extract just the JSON part
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            const jsonPart = rawText.substring(firstBrace, lastBrace + 1);
            
            // Verify this is valid JSON before returning
            try {
                JSON.parse(jsonPart); // Test if it's valid JSON
                return jsonPart; // Return only the valid JSON part
            } catch (e) {
                console.error('Error parsing extracted JSON from AI response:', e);
                // Fall through to return a simple valid JSON
            }
        }
        
        // If we couldn't extract valid JSON, return a simple valid JSON with the text
        return JSON.stringify({ text: 'I received your message but had trouble formatting a proper response. Please try again.' });
    } catch (error) {
        console.error('Error generating AI content:', error);
        return JSON.stringify({ text: 'Sorry, I encountered an error processing your request.' });
    }
}