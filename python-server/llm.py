import replicate

def generate_text(model_path, prompt, max_length=100):
    output = replicate.run(
        model_path,
        input={
            "prompt": prompt,
            "temperature": 0.1,
            "top_p": 0.9,
            "max_length": max_length,
            "repetition_penalty": 1
        }
    )
    return "".join(output)

def build_prompt(messages):
    return '\n'.join(messages)
    